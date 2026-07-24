import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNetInfo } from "@react-native-community/netinfo";
import { Feather, type FeatherIconName } from "@react-native-vector-icons/feather";
import {
  ActivityIndicator,
  type ColorValue,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  type RefreshControlProps,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import * as Font from "expo-font";
import { NavigationContainer, useNavigation, useRoute } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  getContractorDetail,
  getDashboard,
  getReportsLanding,
  fulfillRewardClaim,
  listRewardClaimHistory,
  listRewardClaims,
  listContractors,
  listStaff,
  lookupRewardClaim,
  loginAdmin,
  cancelReturnQr,
  createContractor,
  createStaff,
  deactivateContractor,
  deactivateStaff,
  downloadReport,
  lookupReturnQr,
  reactivateContractor,
  reactivateStaff,
  resetContractorMpin,
  resetStaffPin,
  reverseReturnQr,
  sendRewardFulfillmentOtp,
  updateContractorPhoto,
  updateStaffPhoto,
  type AdminDashboard,
  type AdminReportExportFormat,
  type AdminReportId,
  type AdminReportsLanding,
  type AdminRole,
  type AdminRewardClaimHistoryEntry,
  type AdminRewardClaimLookup,
  type ContractorResetMpinResponse,
  type ContractorDetail,
  type ContractorSummary,
  type RewardFulfillmentOtpResponse,
  type ReturnQrLookupResponse,
  type ReturnQrMutationResponse,
  type StaffMutationResponse,
  type StaffSummary,
} from "./src/api";
import { canUseManagerAction, tabsForRole } from "./src/roleNavigation";
import { normalizeQrScannerData, shouldAcceptQrScannerData } from "./src/qrScanner";
import { getRuntimeAdminMobileDevFeatures } from "./src/devFeatures";
import { clearSession, getSession, saveSession, type StoredAdminSession } from "./src/storage";
import { theme } from "./src/theme";
import { isOfflineNetworkState, NO_INTERNET_MESSAGE } from "./src/offline";

declare const require: (path: string) => number;

type RootStackParamList = {
  Login: undefined;
  Tabs: undefined;
  ContractorDetail: { contractorId: string };
  Staff: undefined;
};

type TabParamList = {
  Dashboard: undefined;
  ReturnScan: undefined;
  Contractors: undefined;
  Rewards: undefined;
  Reports: undefined;
};

type ReturnQrResult = ReturnQrLookupResponse | ReturnQrMutationResponse;
type AdminNavigation = {
  navigate: (screen: keyof TabParamList | "Staff") => void;
};
type AdminRewardSection = "CLAIMS" | "HISTORY";

interface PersonDraft {
  readonly name: string;
  readonly mobileNumber: string;
  readonly photoUrl?: string;
  readonly photoFileName?: string;
}

const emptyPersonDraft: PersonDraft = {
  name: "",
  mobileNumber: "",
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const maxDeviceImageBytes = 2 * 1024 * 1024;
const seededAdminCredentials: Record<AdminRole, { readonly mobileNumber: string; readonly pin: string }> = {
  OWNER: { mobileNumber: "9000000091", pin: "1111" },
  ADMIN: { mobileNumber: "9000000093", pin: "3333" },
  STAFF: { mobileNumber: "9000000092", pin: "2222" },
};
const allowedDeviceImageContentTypes = new Set(["image/png", "image/jpeg"]);
const isWebRuntime = Platform.OS === "web";

interface AdminContextValue {
  readonly session: StoredAdminSession | null;
  readonly setSession: (session: StoredAdminSession | null) => void;
  readonly signOut: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export default function App() {
  useWebDocumentReset();
  useFeatherFontReady();

  const [session, setSession] = useState<StoredAdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const netInfo = useNetInfo();
  const isOffline = isOfflineNetworkState(netInfo);

  useEffect(() => {
    let mounted = true;
    getSession()
      .then((stored) => {
        if (mounted) {
          setSession(stored);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const contextValue = useMemo<AdminContextValue>(
    () => ({
      session,
      setSession,
      signOut: async () => {
        await clearSession();
        setSession(null);
      },
    }),
    [session],
  );

  if (loading) {
    return (
      <SafeAreaProvider>
        <MobileBrowserShell>
          <ScreenFrame>
            <View style={styles.centered}>
              <ActivityIndicator color={theme.color.primary} />
              <Text style={styles.muted}>Restoring session</Text>
            </View>
          </ScreenFrame>
        </MobileBrowserShell>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <MobileBrowserShell>
        <AdminContext.Provider value={contextValue}>
          {isOffline ? <OfflineBanner /> : null}
          <NavigationContainer>
            <RootStack.Navigator
              screenOptions={{
                headerStyle: { backgroundColor: theme.color.canvas },
                headerTitleStyle: { color: theme.color.text, fontWeight: "800" },
                headerTintColor: theme.color.primary,
                contentStyle: { backgroundColor: theme.color.canvas },
              }}
            >
              {session ? (
                <>
                  <RootStack.Screen name="Tabs" component={AdminTabs} options={{ headerShown: false }} />
                  <RootStack.Screen
                    name="ContractorDetail"
                    component={ContractorDetailScreen}
                    options={{ title: "Contractor" }}
                  />
                  <RootStack.Screen
                    name="Staff"
                    component={StaffScreen}
                    options={{ title: "Staff" }}
                  />
                </>
              ) : (
                <RootStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
              )}
            </RootStack.Navigator>
          </NavigationContainer>
        </AdminContext.Provider>
      </MobileBrowserShell>
    </SafeAreaProvider>
  );
}

function useFeatherFontReady(): void {
  const [, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    Font.loadAsync({
      Feather: require("@react-native-vector-icons/feather/fonts/Feather.ttf"),
    })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) {
          setReady(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);
}

function OfflineBanner() {
  return (
    <View accessibilityRole="alert" style={styles.offlineBanner}>
      <Text style={styles.offlineBannerText}>{NO_INTERNET_MESSAGE}</Text>
    </View>
  );
}

function useWebDocumentReset(): void {
  useEffect(() => {
    if (!isWebRuntime || typeof document === "undefined") {
      return;
    }

    if (document.getElementById("volt-admin-mobile-web-reset")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "volt-admin-mobile-web-reset";
    style.textContent = `
      html, body, #root {
        margin: 0;
        padding: 0;
        width: 100%;
        min-width: 0;
        height: 100%;
        overflow-x: hidden;
        box-sizing: border-box;
      }
      *, *::before, *::after {
        box-sizing: border-box;
      }
      body {
        background: #0E1718;
      }
      #root {
        display: flex;
        flex-direction: column;
        max-width: 480px;
        margin: 0 auto;
        background: #F4F7F7;
      }
    `;
    document.head.appendChild(style);
  }, []);
}

function MobileBrowserShell({ children }: { readonly children: React.ReactNode }) {
  if (!isWebRuntime) {
    return <>{children}</>;
  }

  return <>{children}</>;
}

function AdminTabs() {
  const { session } = useAdminContext();
  const role = session?.role ?? "STAFF";
  const tabs = tabsForRole(role);

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, focused }) => <TabGlyph color={color} focused={focused} routeName={route.name} />,
        tabBarActiveTintColor: theme.color.primary,
        tabBarInactiveTintColor: theme.color.muted,
        tabBarStyle: {
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopColor: theme.color.line,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800",
        },
      })}
    >
      {tabs.includes("Dashboard") ? (
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: "Dash" }} />
      ) : null}
      {tabs.includes("ReturnScan") ? (
        <Tab.Screen
          name="ReturnScan"
          component={ReturnScanScreen}
          options={{ tabBarLabel: "Return", title: "Return Scan" }}
        />
      ) : null}
      {tabs.includes("Contractors") ? (
        <Tab.Screen name="Contractors" component={ContractorsScreen} options={{ tabBarLabel: "Contract" }} />
      ) : null}
      {tabs.includes("Rewards") ? <Tab.Screen name="Rewards" component={RewardsScreen} /> : null}
      {tabs.includes("Reports") ? <Tab.Screen name="Reports" component={ReportsScreen} /> : null}
    </Tab.Navigator>
  );
}

function OperatorSummaryCard({
  metrics,
  onSignOut,
  session,
}: {
  readonly metrics: AdminDashboard["metrics"] | undefined;
  readonly onSignOut: () => void;
  readonly session: StoredAdminSession | null;
}) {
  const role = session?.role ?? "STAFF";
  const roleLabel = role === "OWNER" ? "Owner operations" : role === "ADMIN" ? "Admin operations" : "Staff operations";

  return (
    <View style={styles.operatorHeroCard}>
      <View style={styles.operatorHeroTop}>
        <View style={styles.adminIdentityRow}>
          <View style={styles.operatorAvatar}>
            <Text style={styles.operatorAvatarText}>{initials(session?.name ?? role)}</Text>
          </View>
          <View style={styles.operatorCopy}>
            <Text style={styles.eyebrow}>{roleLabel}</Text>
            <Text numberOfLines={2} style={styles.operatorName}>{session?.name ?? "Volt Admin"}</Text>
            <Text numberOfLines={1} style={styles.muted}>{session?.mobileNumber ?? "Session pending"}</Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" onPress={onSignOut} style={styles.smallButton}>
          <Text style={styles.smallButtonText}>Logout</Text>
        </Pressable>
      </View>
      <View style={styles.operatorHeroMetrics}>
        <LightMetric label="QR total" value={String(metrics?.qrTotal ?? 0)} emphasis compact />
        <LightMetric label="Claims" value={String(metrics?.rewardClaims ?? 0)} compact />
        <LightMetric label={canUseManagerAction(role) ? "Staff" : "Access"} value={canUseManagerAction(role) ? String(metrics?.staff ?? 0) : "Read only"} compact />
      </View>
    </View>
  );
}

function LoginScreen() {
  const { setSession } = useAdminContext();
  const devFeatures = useMemo(() => getRuntimeAdminMobileDevFeatures(), []);
  const [role, setRole] = useState<AdminRole>("OWNER");
  const [mobileNumber, setMobileNumber] = useState(() =>
    devFeatures.prefillSeededAdminLogin ? seededAdminCredentials.OWNER.mobileNumber : "",
  );
  const [pin, setPin] = useState(() =>
    devFeatures.prefillSeededAdminLogin ? seededAdminCredentials.OWNER.pin : "",
  );
  const [showPin, setShowPin] = useState(false);
  const [status, setStatus] = useState<StatusMessage>({ tone: "idle", message: "" });
  const [submitting, setSubmitting] = useState(false);

  function selectRole(nextRole: AdminRole) {
    setRole(nextRole);
    setMobileNumber(devFeatures.prefillSeededAdminLogin ? seededAdminCredentials[nextRole].mobileNumber : "");
    setPin(devFeatures.prefillSeededAdminLogin ? seededAdminCredentials[nextRole].pin : "");
    setStatus({ tone: "idle", message: "" });
  }

  async function submit() {
    setSubmitting(true);
    setStatus({ tone: "idle", message: "Signing in" });
    try {
      const response = await loginAdmin({ role, mobileNumber, pin });
      const stored = await saveSession(response);
      setSession(stored);
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Login failed" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenFrame>
      <View style={styles.loginHeader}>
        <View style={styles.adminBrandRow}>
          <View style={styles.adminBrandMark}>
            <Text style={styles.adminBrandMarkText}>V</Text>
          </View>
          <View>
            <Text style={styles.appName}>Volt Admin</Text>
            <Text style={styles.loginSubtitle}>QR, contractors, staff, rewards</Text>
          </View>
        </View>
        <Text style={styles.loginTitle}>Operations console</Text>
      </View>

      <View style={styles.segment}>
        <SegmentButton active={role === "OWNER"} label="OWNER" onPress={() => selectRole("OWNER")} />
        <SegmentButton active={role === "ADMIN"} label="ADMIN" onPress={() => selectRole("ADMIN")} />
        <SegmentButton active={role === "STAFF"} label="STAFF" onPress={() => selectRole("STAFF")} />
      </View>

      <View style={styles.formBlock}>
        <FieldLabel label="Mobile number" />
        <TextInput
          keyboardType="phone-pad"
          maxLength={10}
          onChangeText={setMobileNumber}
          placeholder="10 digit mobile"
          style={styles.input}
          value={mobileNumber}
        />
        <FieldLabel label="PIN" />
        <View style={styles.secretInputRow}>
          <TextInput
            keyboardType="number-pad"
            maxLength={4}
            onChangeText={(value) => setPin(value.replace(/\D/g, "").slice(0, 4))}
            placeholder="4 digit PIN"
            secureTextEntry={!showPin}
            style={[styles.input, styles.secretInput]}
            value={pin}
          />
          <PinVisibilityButton visible={showPin} onPress={() => setShowPin((current) => !current)} />
        </View>
        <PrimaryButton disabled={submitting} label={submitting ? "Signing in" : "Sign in"} onPress={submit} />
        <StatusText status={status} />
      </View>
    </ScreenFrame>
  );
}

function DashboardScreen() {
  const { session, signOut } = useAdminContext();
  const navigation = useNavigation() as AdminNavigation;
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [status, setStatus] = useState<StatusMessage>({ tone: "idle", message: "Loading dashboard" });
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!session) {
      return;
    }
    setStatus({ tone: "idle", message: "Loading dashboard" });
    try {
      const result = await getDashboard(session.token);
      setDashboard(result);
      setStatus({ tone: "success", message: "Dashboard updated" });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Dashboard failed" });
    }
  }

  useEffect(() => {
    void load();
  }, [session?.token]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const metrics = dashboard?.metrics;
  const recentActivity = dashboard?.recentActivity ?? [];
  const isManager = canUseManagerAction(session?.role ?? "STAFF");

  return (
    <ScreenFrame
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.color.primary} />}
    >
      <OperatorSummaryCard
        metrics={metrics}
        onSignOut={() => void signOut()}
        session={session}
      />

      <Pressable
        accessibilityLabel="Open Return Scan"
        accessibilityRole="button"
        onPress={() => navigation.navigate("ReturnScan")}
        style={styles.dashboardHeroPanel}
      >
        <View style={styles.heroCopyColumn}>
          <Text numberOfLines={1} style={styles.heroLabel}>Scan returned product</Text>
          <Text style={styles.heroTitle}>Return Scan</Text>
          <Text numberOfLines={2} style={styles.heroCopy}>Cancel unused QR or reverse points on returned products.</Text>
          <View style={styles.heroStatusRow}>
            <Text style={styles.heroStatusChip}>Camera-first</Text>
            <Text style={styles.heroStatusChip}>Label removal required</Text>
          </View>
        </View>
        <View style={styles.heroIconBadge}>
          <Feather color="#FFFFFF" name="maximize" size={26} />
        </View>
      </Pressable>

      <View style={styles.metricGrid}>
        <MetricButton label="Contractors" value={metrics?.contractors ?? 0} detail="Open directory" onPress={() => navigation.navigate("Contractors")} />
        <MetricButton
          disabled={!isManager}
          label="Staff"
          value={metrics?.staff ?? 0}
          detail={isManager ? "Manage staff" : "Manager only"}
          onPress={() => navigation.navigate("Staff")}
        />
        <MetricButton label="Claims" value={metrics?.rewardClaims ?? 0} detail="Open Claim Desk" onPress={() => navigation.navigate("Rewards")} />
        <MetricButton label="Scanned QR" value={metrics?.qrScanned ?? 0} detail="Open reports" onPress={() => navigation.navigate("Reports")} />
      </View>

      <CompactQrStatus metrics={metrics} />

      {isManager ? (
        <View style={styles.actionBand}>
          <Text style={styles.sectionTitle}>Manager actions</Text>
          <DashboardActionCard
            eyebrow="Claim Desk"
            iconName="award"
            title="Fulfill rewards"
            body="Send OTP, verify active claim, and mark Delivered."
            onPress={() => navigation.navigate("Rewards")}
          />
          <DashboardActionCard
            eyebrow="Team"
            iconName="user-plus"
            title="Staff"
            body="Create staff, reset PINs, and manage active status."
            onPress={() => navigation.navigate("Staff")}
          />
          <DashboardActionCard
            eyebrow="Reports"
            iconName="bar-chart-2"
            title="Download reports"
            body="Export QR, scan, claim, and return reports."
            onPress={() => navigation.navigate("Reports")}
          />
        </View>
      ) : (
        <View style={styles.actionBand}>
          <Text style={styles.sectionTitle}>Staff access</Text>
          <Text style={styles.bodyText}>Contractor data is read-only. Reward fulfillment, staff management, and report downloads are manager-only.</Text>
          <DashboardActionCard
            eyebrow="Available"
            iconName="maximize"
            title="Return Scan"
            body="Lookup return labels and perform allowed QR return operations."
            onPress={() => navigation.navigate("ReturnScan")}
          />
          <DashboardActionCard
            eyebrow="Read only"
            iconName="users"
            title="Contractors"
            body="View contractor status, sites, and points."
            onPress={() => navigation.navigate("Contractors")}
          />
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent activity</Text>
      </View>
      {recentActivity.slice(0, 5).map((activity, index) => (
        <ActivityRow
          key={activity.auditEventId || `${activity.action}-${activity.createdAt}-${index}`}
          action={activity.action}
          actorRole={activity.actorRole}
          createdAt={activity.createdAt}
          targetType={activity.targetType}
        />
      ))}
      {dashboard && recentActivity.length === 0 ? (
        <StateCard body="New QR prints, return actions, reward claims, contractor updates, and staff actions will appear here." title="No recent activity" tone="muted" />
      ) : null}
      <StatusText status={status} />
    </ScreenFrame>
  );
}

function ReturnScanScreen() {
  const { session } = useAdminContext();
  const devFeatures = useMemo(() => getRuntimeAdminMobileDevFeatures(), []);
  const [token, setToken] = useState("");
  const [result, setResult] = useState<ReturnQrResult | null>(null);
  const [labelRemoved, setLabelRemoved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<StatusMessage>({
    tone: "idle",
    message: "",
  });

  async function lookup(scannedToken?: string) {
    const qrToken = normalizeQrScannerData(scannedToken ?? token);
    if (!session) {
      setStatus({ tone: "danger", message: "Admin session is not available." });
      return;
    }
    if (!qrToken) {
      setStatus({ tone: "danger", message: "Enter a QR token before lookup." });
      return;
    }
    setBusy(true);
    setStatus({ tone: "idle", message: "Checking QR status" });
    try {
      setToken(qrToken);
      const response = await lookupReturnQr(session.token, qrToken);
      setResult(response);
      setLabelRemoved(false);
      setStatus({ tone: "idle", message: "" });
    } catch (error) {
      setResult(null);
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "QR lookup failed" });
    } finally {
      setBusy(false);
    }
  }

  async function executeReturnAction(action: "cancel" | "reverse") {
    if (!session || !result) {
      return;
    }
    if (!labelRemoved) {
      setStatus({ tone: "danger", message: "Confirm that the QR label was removed and discarded." });
      return;
    }

    setBusy(true);
    setStatus({ tone: "idle", message: action === "cancel" ? "Cancelling QR" : "Reversing points" });
    try {
      const response = action === "cancel"
        ? await cancelReturnQr(session.token, result.qrUnitId, { labelRemovedAndDiscarded: true })
        : await reverseReturnQr(session.token, result.qrUnitId, { labelRemovedAndDiscarded: true });
      setResult(response);
      setLabelRemoved(false);
      setStatus({ tone: "idle", message: "" });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Return action failed" });
    } finally {
      setBusy(false);
    }
  }

  function resetScan() {
    setResult(null);
    setToken("");
    setLabelRemoved(false);
    setStatus({ tone: "idle", message: "" });
  }

  return (
    <ScreenFrame>
      <View style={styles.scanPanel}>
        <View style={styles.scanLens}>
          <Text style={styles.scanMark}>QR</Text>
        </View>
        <Text style={styles.scanEyebrow}>Returned product</Text>
        <Text style={styles.scanTitle}>Returned product label</Text>
        <Text style={styles.scanSubtitle}>Scan status, cancel unused QR, or reverse collected points.</Text>
      </View>
      <View style={styles.returnStepStrip}>
        <ReturnStep label="Scan" text="Read returned product QR" />
        <ReturnStep label="Review" text="Check status and points impact" />
        <ReturnStep label="Confirm" text="Remove and discard label" />
      </View>
      <ReturnQrCameraScanner
        disabled={busy}
        onScanned={(qrToken) => lookup(qrToken)}
      />
      {devFeatures.allowManualQrEntry ? (
        <View style={styles.manualScanFallback}>
          <Text style={styles.manualScanTitle}>Manual test fallback</Text>
          <FieldLabel label="QR token" />
          <TextInput
            autoCapitalize="none"
            onChangeText={setToken}
            placeholder="Paste or type QR token"
            style={styles.input}
            value={token}
          />
          <PrimaryButton disabled={busy} label={busy ? "Working" : "Lookup status"} onPress={() => void lookup()} />
        </View>
      ) : null}
      {result ? (
        <ReturnQrStatusCard
          busy={busy}
          labelRemoved={labelRemoved}
          onCancel={() => void executeReturnAction("cancel")}
          onReverse={() => void executeReturnAction("reverse")}
          onScanAnother={resetScan}
          onToggleLabelRemoved={() => setLabelRemoved((current) => !current)}
          result={result}
        />
      ) : null}
      <StatusText status={status} />
    </ScreenFrame>
  );
}

function ReturnQrCameraScanner({
  disabled,
  onScanned,
}: {
  readonly disabled: boolean;
  readonly onScanned: (token: string) => Promise<void>;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [lastAcceptedData, setLastAcceptedData] = useState("");

  async function handleBarcodeScanned(result: BarcodeScanningResult): Promise<void> {
    if (disabled || busy || !shouldAcceptQrScannerData(result.data, lastAcceptedData)) {
      return;
    }
    const token = normalizeQrScannerData(result.data);
    setLastAcceptedData(token);
    setBusy(true);
    try {
      await onScanned(token);
    } finally {
      setBusy(false);
    }
  }

  if (!permission) {
    return (
      <View style={styles.cameraNotice}>
        <Text style={styles.cameraNoticeText}>Opening camera scanner.</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.cameraPermissionCard}>
        <Text style={styles.sectionTitle}>Camera permission needed</Text>
        <Text style={styles.muted}>Allow camera access to scan the returned product QR label.</Text>
        <PrimaryButton label="Allow camera" onPress={() => void requestPermission()} />
      </View>
    );
  }

  return (
    <View style={styles.cameraScannerCard}>
      <View style={styles.cameraPreviewShell}>
        <CameraView
          active={!disabled && !busy}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          facing="back"
          onBarcodeScanned={!disabled && !busy ? (result) => void handleBarcodeScanned(result) : undefined}
          style={styles.cameraPreview}
        />
        <View pointerEvents="none" style={styles.cameraOverlay}>
          <View style={styles.cameraFrame} />
        </View>
      </View>
      <Text style={styles.cameraScannerTitle}>{busy ? "Checking QR" : "Camera scanner ready"}</Text>
      <Text style={styles.cameraScannerHint}>Place the returned product QR label inside the frame.</Text>
    </View>
  );
}

function ReturnQrStatusCard({
  busy,
  labelRemoved,
  onCancel,
  onReverse,
  onScanAnother,
  onToggleLabelRemoved,
  result,
}: {
  readonly busy: boolean;
  readonly labelRemoved: boolean;
  readonly onCancel: () => void;
  readonly onReverse: () => void;
  readonly onScanAnother: () => void;
  readonly onToggleLabelRemoved: () => void;
  readonly result: ReturnQrResult;
}) {
  const operation = getReturnOperation(result);
  const canCancel = result.action === "CAN_CANCEL" && !operation;
  const canReverse = result.action === "CAN_REVERSE" && !operation;
  const actionDisabled = busy || !labelRemoved;
  const stateTone = returnStateTone(operation?.type ?? result.status);
  const actionLabel = canCancel ? "Cancel QR allowed" : canReverse ? "Reverse points allowed" : humanizeAction(result.status);

  return (
    <View style={styles.returnCard}>
      <View style={styles.returnCardHeader}>
        <StateGlyph compact tone={stateTone} />
        <View style={styles.returnCardCopy}>
          <Text numberOfLines={2} style={styles.eyebrow}>{actionLabel}</Text>
          <Text numberOfLines={3} style={styles.returnProduct}>{result.qr.productName}</Text>
          <Text numberOfLines={1} style={styles.rowMeta}>
            {result.qr.invoiceNumber} · {result.qr.productSku ?? result.qr.shortCode}
          </Text>
        </View>
        <ReturnStatusBadge status={operation?.type ?? result.status} />
      </View>

      <View style={styles.lightMetricRow}>
        <LightMetric label="QR points" value={formatPoints(result.qr.points)} emphasis />
        <LightMetric label="Action" value={result.action === "NONE" ? "Review" : result.action === "CAN_CANCEL" ? "Cancel" : "Reverse"} />
      </View>

      <View style={styles.returnDetailGrid}>
        <DetailRow label="Token" value={result.tokenStatus} />
        <DetailRow label="Printed" value={result.qr.printedAt ? formatDate(result.qr.printedAt) : "Not printed"} />
        <DetailRow label="Expires" value={result.qr.expiresAt ? formatDate(result.qr.expiresAt) : "--"} />
        <DetailRow label="Short code" value={result.qr.shortCode} />
      </View>

      {result.contractor ? (
        <View style={styles.contractorImpact}>
          <Text style={styles.sectionTitle}>Contractor</Text>
          <DetailRow label="Name" value={result.contractor.name} />
          <DetailRow label="Mobile" value={result.contractor.mobileNumber} />
          <DetailRow label="Available" value={formatPoints(result.contractor.pointsAvailable)} />
          {result.qr.scannedAt ? <DetailRow label="Scanned" value={formatDateTime(result.qr.scannedAt)} /> : null}
        </View>
      ) : null}

      {result.reverseImpact ? <ReverseImpactPanel impact={result.reverseImpact} /> : null}

      {operation ? <OperationPanel operation={operation} /> : null}

      {!operation && result.action === "NONE" ? (
        <View style={styles.nonActionPanel}>
          <Text style={styles.deniedTitle}>{humanizeAction(result.status)}</Text>
          <Text style={styles.bodyText}>{result.reason}</Text>
        </View>
      ) : null}

      {canCancel || canReverse ? (
        <>
          <View style={styles.returnWarningCard}>
            <Text style={styles.warningTitle}>Physical label check required</Text>
            <Text style={styles.warningCopyNeutral}>Only continue after the QR label has been removed from the returned product and discarded.</Text>
          </View>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: labelRemoved }}
            onPress={onToggleLabelRemoved}
            style={styles.checkRow}
          >
            <View style={[styles.checkbox, labelRemoved ? styles.checkboxChecked : null]}>
              <Text style={styles.checkboxMark}>{labelRemoved ? "OK" : ""}</Text>
            </View>
            <Text style={styles.checkText}>QR label removed and discarded</Text>
          </Pressable>
          {canCancel ? (
            <DestructiveButton disabled={actionDisabled} label="Cancel QR" onPress={onCancel} tone="warning" />
          ) : null}
          {canReverse ? (
            <DestructiveButton disabled={actionDisabled} label="Reverse points" onPress={onReverse} tone="danger" />
          ) : null}
        </>
      ) : null}

      {operation ? <SecondaryButton label="Scan another QR" onPress={onScanAnother} /> : null}
    </View>
  );
}

function ReverseImpactPanel({ impact }: { readonly impact: NonNullable<ReturnQrLookupResponse["reverseImpact"]> }) {
  return (
    <View style={[styles.impactPanel, impact.createsNegativeBalance ? styles.impactPanelDanger : null]}>
      <Text style={styles.sectionTitle}>Points reversal</Text>
      <DetailRow label="Reverse" value={formatPoints(impact.pointsToReverse)} />
      <DetailRow label="Current balance" value={formatPoints(impact.currentBalance)} />
      <DetailRow label="After QR reverse" value={formatPoints(impact.projectedBalanceAfterQrReverse)} />
      <DetailRow label="After claim impact" value={formatPoints(impact.projectedBalanceAfterClaimRevocations)} />
      {impact.claimsToRevoke.length > 0 ? (
        <View style={styles.claimList}>
          <Text style={styles.warningTitle}>Unfulfilled claims to revoke</Text>
          {impact.claimsToRevoke.map((claim) => (
            <Text key={claim.rewardClaimId} style={styles.claimLine}>
              {claim.claimId} · {claim.rewardName} · {formatPoints(claim.pointsDeducted)}
            </Text>
          ))}
        </View>
      ) : null}
      {impact.createsNegativeBalance ? (
        <Text style={styles.warningCopy}>Balance will remain negative after chosen-claim revocation.</Text>
      ) : null}
    </View>
  );
}

function OperationPanel({ operation }: { readonly operation: ReturnQrMutationResponse["operation"] }) {
  return (
    <View style={styles.operationPanel}>
      <Text style={styles.operationTitle}>{operation.type === "CANCELLED" ? "QR cancelled" : "QR reversed"}</Text>
      <Text style={styles.bodyText}>Reason: {operation.reason}</Text>
      {typeof operation.balanceAfter === "number" ? (
        <Text style={styles.bodyText}>Balance after: {formatPoints(operation.balanceAfter)}</Text>
      ) : null}
      {operation.revokedClaims.length > 0 ? (
        <View style={styles.claimList}>
          <Text style={styles.warningTitle}>Claims revoked</Text>
          {operation.revokedClaims.map((claim) => (
            <Text key={claim.rewardClaimId} style={styles.claimLine}>
              {claim.claimId} · {claim.rewardName}
            </Text>
          ))}
        </View>
      ) : null}
      <Text numberOfLines={1} style={styles.rowMeta}>Audit {operation.auditEventId.slice(-8).toUpperCase()}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text numberOfLines={2} style={styles.detailLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function ReturnStatusBadge({ status }: { readonly status: string }) {
  const tone = status === "REVERSED" || status === "CANCELLED"
    ? styles.returnBadgeDanger
    : status === "PRINTED_UNCLAIMED" || status === "REPRINTED" || status === "CAN_CANCEL"
      ? styles.returnBadgeWarning
      : status === "SCANNED_CLAIMED" || status === "CAN_REVERSE"
        ? styles.returnBadgeSuccess
        : styles.returnBadgeMuted;
  return (
    <View style={[styles.returnBadge, tone]}>
      <Text style={styles.returnBadgeText}>{humanizeAction(status)}</Text>
    </View>
  );
}

function ContractorsScreen() {
  const { session } = useAdminContext();
  const navigation = useNavigation() as RootNavigation;
  const [contractors, setContractors] = useState<readonly ContractorSummary[]>([]);
  const [draft, setDraft] = useState<PersonDraft>(emptyPersonDraft);
  const [status, setStatus] = useState<StatusMessage>({ tone: "idle", message: "Loading contractors" });
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isManager = canUseManagerAction(session?.role ?? "STAFF");

  async function load() {
    if (!session) {
      return;
    }
    setStatus({ tone: "idle", message: "Loading contractors" });
    try {
      const result = await listContractors(session.token);
      setContractors(result);
      setStatus({ tone: "success", message: `${result.length} contractors loaded` });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Contractors failed" });
    }
  }

  useEffect(() => {
    void load();
  }, [session?.token]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function pickRegistrationPhoto() {
    setBusy(true);
    setStatus({ tone: "idle", message: "Choosing contractor photo" });
    try {
      const image = await pickDeviceImage({ quality: 0.58 });
      if (!image) {
        setStatus({ tone: "idle", message: "Photo selection cancelled" });
        return;
      }
      setDraft((current) => ({
        ...current,
        photoUrl: image.dataUrl,
        ...(image.fileName ? { photoFileName: image.fileName } : {}),
      }));
      setStatus({ tone: "success", message: "Photo ready for registration" });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Photo selection failed" });
    } finally {
      setBusy(false);
    }
  }

  async function registerContractor() {
    if (!session || !isManager) {
      return;
    }
    if (!draft.name.trim() || draft.mobileNumber.length !== 10) {
      setStatus({ tone: "danger", message: "Enter contractor name and 10 digit mobile number." });
      return;
    }

    setBusy(true);
    setStatus({ tone: "idle", message: "Registering contractor" });
    try {
      const created = await createContractor(session.token, {
        name: draft.name.trim(),
        mobileNumber: draft.mobileNumber,
        ...(draft.photoUrl ? { photoUrl: draft.photoUrl } : {}),
      });
      setContractors((current) => [created, ...current.filter((item) => item.contractorId !== created.contractorId)]);
      setDraft(emptyPersonDraft);
      setStatus({ tone: "success", message: `${created.name} registered. Use Reset MPIN from detail if needed.` });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Contractor registration failed" });
    } finally {
      setBusy(false);
    }
  }

  const activeCount = contractors.filter((contractor) => contractor.status === "ACTIVE").length;
  const inactiveCount = contractors.length - activeCount;
  const totalAvailablePoints = contractors.reduce((total, contractor) => total + contractor.availablePoints, 0);

  return (
    <ScreenFrame
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.color.primary} />}
    >
      <View style={styles.topBar}>
        <View style={styles.operatorCopy}>
          <Text style={styles.eyebrow}>{isManager ? "Manage" : "Read only"}</Text>
          <Text numberOfLines={1} style={styles.screenTitle}>Contractors</Text>
          <Text numberOfLines={2} style={styles.muted}>{isManager ? "Registration and profile controls" : "View contractor status"}</Text>
        </View>
      </View>

      <StateCard
        body={isManager
          ? "Register contractors, open profiles, update photos, reset MPINs, and manage active status."
          : "Profiles, sites, points, and scans are visible without mutation controls."}
        title={isManager ? "Contractor management" : "Read-only contractor directory"}
        tone={isManager ? "success" : "muted"}
      />

      <View style={styles.metricGrid}>
        <MetricTile label="Active" value={activeCount} />
        <MetricTile label="Inactive" value={inactiveCount} />
        <MetricTile label="Sites" value={contractors.reduce((total, contractor) => total + contractor.siteCount, 0)} />
        <MetricTile label="Scans" value={contractors.reduce((total, contractor) => total + contractor.scanCount, 0)} />
      </View>
      <View style={styles.lightMetricRow}>
        <LightMetric compact label="Directory points available" value={formatPoints(totalAvailablePoints)} />
        <LightMetric compact label="Contractor records" value={String(contractors.length)} />
      </View>

      {isManager ? (
        <View style={styles.formBlock}>
          <View style={styles.panelHeaderRow}>
            <View style={styles.rowBody}>
              <Text style={styles.sectionTitle}>Register contractor</Text>
              <Text style={styles.rowMeta}>Name and mobile become immutable after registration.</Text>
            </View>
            <Text numberOfLines={1} style={[styles.badge, styles.badgeGood]}>{session?.role ?? "ADMIN"}</Text>
          </View>
          <FieldLabel label="Full name" />
          <TextInput
            autoCapitalize="words"
            onChangeText={(value) => setDraft((current) => ({ ...current, name: value }))}
            placeholder="Ramesh Sharma"
            style={styles.input}
            value={draft.name}
          />
          <FieldLabel label="Mobile number" />
          <TextInput
            keyboardType="phone-pad"
            maxLength={10}
            onChangeText={(value) => setDraft((current) => ({ ...current, mobileNumber: normalizeMobileInput(value) }))}
            placeholder="10 digit mobile"
            style={styles.input}
            value={draft.mobileNumber}
          />
          {draft.photoUrl ? (
            <View style={styles.photoPreviewRow}>
              <Image source={{ uri: draft.photoUrl }} style={styles.avatar} />
              <Text numberOfLines={2} style={styles.rowMeta}>{draft.photoFileName ?? "Contractor photo selected"}</Text>
            </View>
          ) : null}
          <SecondaryButton disabled={busy} label={draft.photoUrl ? "Change photo" : "Upload photo"} onPress={() => void pickRegistrationPhoto()} />
          <PrimaryButton disabled={busy} label={busy ? "Saving" : "Register contractor"} onPress={() => void registerContractor()} />
        </View>
      ) : (
        <View style={styles.deniedBox}>
          <Text style={styles.deniedTitle}>Read-only contractor directory</Text>
          <Text style={styles.bodyText}>STAFF can review contractor status and sites but cannot register, edit, reset MPIN, or deactivate accounts.</Text>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Directory</Text>
      </View>
      {contractors.map((contractor) => (
        <Pressable
          accessibilityLabel={`Open contractor ${contractor.name}`}
          accessibilityRole="button"
          key={contractor.contractorId}
          onPress={() => navigation.navigate("ContractorDetail", { contractorId: contractor.contractorId })}
          style={styles.contractorRow}
        >
          <Avatar name={contractor.name} {...(contractor.photoUrl ? { photoUrl: contractor.photoUrl } : {})} />
          <View style={styles.rowBody}>
            <View style={styles.entityHeaderRow}>
              <Text numberOfLines={1} style={[styles.rowTitle, styles.entityTitleText]}>{contractor.name}</Text>
              <Text numberOfLines={1} style={[styles.badge, contractor.status === "ACTIVE" ? styles.badgeGood : styles.badgeWarn]}>
                {contractor.status}
              </Text>
            </View>
            <Text numberOfLines={1} style={styles.rowMeta}>
              {contractor.contractorCode} · {contractor.mobileNumber}
            </Text>
            <View style={styles.rowFactStrip}>
              <MiniFact label="Points" value={formatPoints(contractor.availablePoints)} />
              <MiniFact label="Sites" value={String(contractor.siteCount)} />
              <MiniFact label="Scans" value={String(contractor.scanCount)} />
            </View>
          </View>
          <Text style={styles.chevronText}>{">"}</Text>
        </Pressable>
      ))}
      {contractors.length === 0 ? <EmptyState title="No contractors loaded" /> : null}
      <StatusText status={status} />
    </ScreenFrame>
  );
}

function ContractorDetailScreen() {
  const { session } = useAdminContext();
  const route = useRoute() as ContractorDetailRoute;
  const [detail, setDetail] = useState<ContractorDetail | null>(null);
  const [status, setStatus] = useState<StatusMessage>({ tone: "idle", message: "Loading contractor" });
  const [photoBusy, setPhotoBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [resetMpinResult, setResetMpinResult] = useState<ContractorResetMpinResponse | null>(null);
  const isManager = canUseManagerAction(session?.role ?? "STAFF");

  async function loadContractor(successMessage = "Contractor loaded") {
    if (!session) {
      return;
    }
    setStatus({ tone: "idle", message: "Loading contractor" });
    try {
      const result = await getContractorDetail(session.token, route.params.contractorId);
      setDetail(result);
      setStatus({ tone: "success", message: successMessage });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Contractor failed" });
    }
  }

  useEffect(() => {
    void loadContractor();
  }, [route.params.contractorId, session?.token]);

  async function pickContractorPhoto() {
    if (!session || !detail || !isManager) {
      return;
    }
    setPhotoBusy(true);
    setStatus({ tone: "idle", message: "Choosing contractor photo" });
    try {
      const image = await pickDeviceImage({ quality: 0.55 });
      if (!image) {
        setStatus({ tone: "idle", message: "Photo selection cancelled" });
        return;
      }
      const updated = await updateContractorPhoto(session.token, detail.contractorId, { photoUrl: image.dataUrl });
      setDetail(updated);
      setResetMpinResult(null);
      setStatus({ tone: "success", message: "Contractor photo updated" });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Photo upload failed" });
    } finally {
      setPhotoBusy(false);
    }
  }

  async function resetContractorPin() {
    if (!session || !detail || !isManager) {
      return;
    }
    setActionBusy(true);
    setStatus({ tone: "idle", message: "Resetting contractor MPIN" });
    try {
      const result = await resetContractorMpin(session.token, detail.contractorId);
      setResetMpinResult(result);
      setStatus({ tone: "success", message: `Temporary MPIN ${result.temporaryMpin} valid until ${formatDateTime(result.expiresAt)}` });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "MPIN reset failed" });
    } finally {
      setActionBusy(false);
    }
  }

  async function toggleContractorStatus() {
    if (!session || !detail || !isManager) {
      return;
    }
    setActionBusy(true);
    setStatus({ tone: "idle", message: detail.status === "ACTIVE" ? "Deactivating contractor" : "Reactivating contractor" });
    try {
      const updated = detail.status === "ACTIVE"
        ? await deactivateContractor(session.token, detail.contractorId)
        : await reactivateContractor(session.token, detail.contractorId);
      setDetail(updated);
      setResetMpinResult(null);
      setStatus({ tone: "success", message: updated.status === "ACTIVE" ? "Contractor reactivated" : "Contractor deactivated" });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Status update failed" });
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <ScreenFrame>
      {detail ? (
        <>
          <View style={styles.profileBand}>
            <Avatar name={detail.name} {...(detail.photoUrl ? { photoUrl: detail.photoUrl } : {})} large />
            <View style={styles.profileText}>
              <View style={styles.entityHeaderRow}>
                <Text numberOfLines={2} style={[styles.screenTitle, styles.entityTitleText]}>{detail.name}</Text>
                <Text numberOfLines={1} style={[styles.badge, detail.status === "ACTIVE" ? styles.badgeGood : styles.badgeWarn]}>
                  {detail.status}
                </Text>
              </View>
              <Text numberOfLines={1} style={styles.muted}>{detail.mobileNumber}</Text>
              <Text numberOfLines={1} style={styles.muted}>{detail.contractorCode}</Text>
            </View>
          </View>
          {!isManager ? (
            <StateCard
              body="This profile is view-only for STAFF. Editing, MPIN reset, and active-status changes are manager-only."
              title="Read-only profile"
              tone="muted"
            />
          ) : null}
          {isManager ? (
            <View style={styles.actionBand}>
              <View style={styles.panelHeaderRow}>
                <View style={styles.rowBody}>
                  <Text style={styles.sectionTitle}>Management actions</Text>
                  <Text style={styles.rowMeta}>Photo, MPIN, and active-status controls remain backend validated.</Text>
                </View>
                <Text numberOfLines={1} style={[styles.badge, styles.badgeGood]}>{session?.role ?? "ADMIN"}</Text>
              </View>
              <SecondaryButton
                disabled={photoBusy || actionBusy}
                label={photoBusy ? "Uploading photo" : "Upload contractor photo"}
                onPress={() => void pickContractorPhoto()}
              />
              <SecondaryButton
                disabled={photoBusy || actionBusy || detail.status !== "ACTIVE"}
                label={actionBusy ? "Working" : "Reset MPIN"}
                onPress={() => void resetContractorPin()}
              />
              <DestructiveButton
                disabled={photoBusy || actionBusy}
                label={detail.status === "ACTIVE" ? "Deactivate contractor" : "Reactivate contractor"}
                onPress={() => void toggleContractorStatus()}
                tone={detail.status === "ACTIVE" ? "danger" : "warning"}
              />
              {resetMpinResult ? (
                <View style={styles.operationPanel}>
                  <Text style={styles.operationTitle}>Temporary MPIN issued</Text>
                  <DetailRow label="MPIN" value={resetMpinResult.temporaryMpin} />
                  <DetailRow label="Expires" value={formatDateTime(resetMpinResult.expiresAt)} />
                  <Text style={styles.bodyText}>Local dev delivery is returned here. In production this goes by configured SMS.</Text>
                </View>
              ) : null}
            </View>
          ) : null}
          <View style={styles.metricGrid}>
            <MetricTile label="Available" value={detail.availablePoints} />
            <MetricTile label="Lifetime" value={detail.totalAccumulatedPoints} />
            <MetricTile label="Scans" value={detail.scanCount} />
            <MetricTile label="Claims" value={detail.rewardClaimCount} />
          </View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sites</Text>
          </View>
          {detail.sites.map((site) => (
            <View key={site.siteId} style={styles.siteRow}>
              <Text numberOfLines={1} style={styles.rowTitle}>{site.clientName}</Text>
              <Text numberOfLines={2} style={styles.rowMeta}>{formatSite(site)}</Text>
              <Text numberOfLines={1} style={styles.rowMeta}>
              {site.status} · {site.scanCount} scans
              </Text>
            </View>
          ))}
          {detail.sites.length === 0 ? <EmptyState title="No active sites linked" /> : null}
        </>
      ) : (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.color.primary} />
        </View>
      )}
      <StatusText status={status} />
    </ScreenFrame>
  );
}

function RewardsScreen() {
  const { session } = useAdminContext();
  const devFeatures = useMemo(() => getRuntimeAdminMobileDevFeatures(), []);
  const isManager = canUseManagerAction(session?.role ?? "STAFF");
  const [claims, setClaims] = useState<readonly AdminRewardClaimLookup[]>([]);
  const [history, setHistory] = useState<readonly AdminRewardClaimHistoryEntry[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<AdminRewardClaimLookup | null>(null);
  const [activeSection, setActiveSection] = useState<AdminRewardSection>("CLAIMS");
  const [claimIdInput, setClaimIdInput] = useState("");
  const [otp, setOtp] = useState("");
  const [otpResult, setOtpResult] = useState<RewardFulfillmentOtpResponse | null>(null);
  const [status, setStatus] = useState<StatusMessage>({ tone: "idle", message: "Loading rewards" });
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!session) {
      return;
    }
    setStatus({ tone: "idle", message: "Loading rewards" });
    try {
      const [nextClaims, nextHistory] = await Promise.all([
        isManager ? listRewardClaims(session.token) : Promise.resolve([]),
        listRewardClaimHistory(session.token),
      ]);
      setClaims(nextClaims);
      setHistory(nextHistory);
      setSelectedClaim((current) => {
        if (!isManager) {
          return null;
        }
        const currentClaim = current ? nextClaims.find((item) => item.claim.claimId === current.claim.claimId) : undefined;
        return currentClaim ?? nextClaims[0] ?? current;
      });
      setStatus({ tone: "success", message: isManager ? `${nextClaims.length} claims, ${nextHistory.length} history records` : `${nextHistory.length} history records` });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Rewards failed" });
    }
  }

  useEffect(() => {
    void load();
  }, [session?.token]);

  useEffect(() => {
    if (!isManager && activeSection !== "HISTORY") {
      setActiveSection("HISTORY");
    }
  }, [activeSection, isManager]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function lookupClaimById() {
    if (!session || !claimIdInput.trim()) {
      setStatus({ tone: "danger", message: "Enter a Claim ID." });
      return;
    }
    setBusy(true);
    setStatus({ tone: "idle", message: "Looking up claim" });
    try {
      const result = await lookupRewardClaim(session.token, claimIdInput.trim());
      setSelectedClaim(result);
      setOtp("");
      setOtpResult(null);
      setStatus({ tone: "success", message: `${result.claim.claimId} loaded` });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Claim lookup failed" });
    } finally {
      setBusy(false);
    }
  }

  async function sendOtp() {
    if (!session || !selectedClaim) {
      return;
    }
    const claimId = selectedClaim.claim.claimId;
    setBusy(true);
    setStatus({ tone: "idle", message: "Sending OTP" });
    try {
      const result = await sendRewardFulfillmentOtp(session.token, claimId);
      const refreshedClaim = await lookupRewardClaim(session.token, claimId);
      setSelectedClaim(refreshedClaim);
      setOtpResult(result);
      const visibleMockOtp = devFeatures.showMockOtp ? result.delivery.mockOtp : undefined;
      setOtp(visibleMockOtp ?? "");
      await load();
      setStatus({ tone: "success", message: visibleMockOtp ? `OTP sent. Local dev OTP: ${visibleMockOtp}` : "OTP sent" });
    } catch (error) {
      setOtpResult(null);
      setOtp("");
      await load();
      setStatus({ tone: "warning", message: error instanceof Error ? error.message : "OTP send failed" });
    } finally {
      setBusy(false);
    }
  }

  async function markDelivered() {
    if (!session || !selectedClaim || !otpResult) {
      setStatus({ tone: "danger", message: "Send OTP before marking Delivered." });
      return;
    }
    setBusy(true);
    setStatus({ tone: "idle", message: "Marking Delivered" });
    try {
      const result = await fulfillRewardClaim(session.token, selectedClaim.claim.claimId, {
        challengeId: otpResult.challengeId,
        otp,
      });
      setSelectedClaim(result);
      setOtp("");
      setOtpResult(null);
      await load();
      setSelectedClaim(result);
      setStatus({ tone: "success", message: `${result.claim.claimId} marked Delivered` });
    } catch (error) {
      await load();
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Delivery failed" });
    } finally {
      setBusy(false);
    }
  }

  const canMarkDelivered = Boolean(
    !busy &&
    otpResult &&
    otp.length === 6 &&
    selectedClaim?.claim.status === "CHOSEN",
  );
  const visibleRewardSection: AdminRewardSection = isManager ? activeSection : "HISTORY";
  const deliveredHistoryCount = history.filter((item) => item.claim.status === "FULFILLED").length;
  const openHistoryCount = history.filter((item) => item.claim.status === "CHOSEN").length;

  return (
    <ScreenFrame
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.color.primary} />}
    >
      <View style={styles.topBar}>
        <View style={styles.operatorCopy}>
          <Text style={styles.eyebrow}>{isManager ? "Claim Desk" : "Reward History"}</Text>
          <Text numberOfLines={1} style={styles.screenTitle}>Rewards</Text>
          <Text numberOfLines={2} style={styles.muted}>{isManager ? "Fulfill reward claims and review history." : "Review contractor reward developments."}</Text>
        </View>
      </View>

      <StateCard
        body={isManager
          ? "Use Claim Desk for OTP and Delivered controls. Reward setup stays in Admin Web."
          : "Reward History is available for review. OTP and Delivered controls are manager-only."}
        title={isManager ? "Reward fulfillment" : "Reward History read-only"}
        tone={isManager ? "success" : "muted"}
      />

      <View style={styles.lightMetricRow}>
        <LightMetric compact emphasis={isManager} label={isManager ? "Active Claim Raised" : "History records"} value={String(isManager ? claims.length : history.length)} />
        <LightMetric compact label="Delivered records" value={String(deliveredHistoryCount)} />
      </View>

      <RewardSectionTabs activeSection={visibleRewardSection} isManager={isManager} onChange={setActiveSection} />

      {isManager && visibleRewardSection === "CLAIMS" ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Claim Desk</Text>
          </View>
          <StateCard
            body="Select a valid Claim Raised request, send contractor OTP, then mark Delivered only after OTP verification."
            title="Fulfillment checkpoint"
            tone="warning"
          />
          {claims.length === 0 ? <EmptyState title="No active Claim Raised requests." /> : null}
          {claims.map((item) => (
            <Pressable
              accessibilityLabel={`Select claim ${item.claim.claimId}`}
              accessibilityRole="button"
              key={item.claim.rewardClaimId}
              onPress={() => {
                setSelectedClaim(item);
                setOtp("");
                setOtpResult(null);
              }}
              style={[
                styles.rewardClaimRow,
                selectedClaim?.claim.rewardClaimId === item.claim.rewardClaimId ? styles.rewardClaimRowSelected : null,
              ]}
            >
              <View style={styles.rowBody}>
                <View style={styles.entityHeaderRow}>
                  <Text numberOfLines={1} style={[styles.rowTitle, styles.entityTitleText]}>{item.contractor.name}</Text>
                  <Text numberOfLines={1} style={[styles.badge, styles.badgeGood]}>Claim Raised</Text>
                </View>
                <Text numberOfLines={1} style={styles.rowMeta}>{item.contractor.mobileNumber} · {item.claim.claimId}</Text>
                <View style={styles.rowFactStrip}>
                  <MiniFact label="Reward" value={item.claim.rewardName} />
                  <MiniFact label="Points" value={formatPoints(item.claim.pointsDeducted)} />
                </View>
              </View>
              <Text style={styles.chevronText}>{">"}</Text>
            </Pressable>
          ))}

          <View style={styles.formBlock}>
            <FieldLabel label="Claim ID lookup" />
            <TextInput
              autoCapitalize="characters"
              onChangeText={(value) => setClaimIdInput(value.toUpperCase())}
              placeholder="CLM-ACTIVE01"
              style={styles.input}
              value={claimIdInput}
            />
            <SecondaryButton disabled={busy} label="Lookup claim" onPress={() => void lookupClaimById()} />
          </View>

          {selectedClaim ? (
            <View style={styles.rewardMobileSummary}>
              <View style={styles.panelHeaderRow}>
                <View style={styles.rowBody}>
                  <Text style={styles.eyebrow}>Selected claim</Text>
                  <Text numberOfLines={1} style={styles.sectionTitle}>{selectedClaim.claim.claimId}</Text>
                </View>
                <Text numberOfLines={1} style={[styles.badge, selectedClaim.claim.status === "FULFILLED" ? styles.badgeGood : styles.badgeWarn]}>
                  {compactClaimStatusLabel(selectedClaim.claim.status)}
                </Text>
              </View>
              <DetailRow label="Status" value={claimStatusLabel(selectedClaim.claim.status)} />
              <DetailRow label="Contractor" value={selectedClaim.contractor.name} />
              <DetailRow label="Phone" value={selectedClaim.contractor.mobileNumber} />
              <DetailRow label="Reward" value={selectedClaim.claim.rewardName} />
              <DetailRow label="Points spent" value={formatPoints(selectedClaim.claim.pointsDeducted)} />
              <DetailRow label="Raised" value={formatDateTime(selectedClaim.claim.chosenAt)} />
              {selectedClaim.claim.fulfilledAt ? <DetailRow label="Delivered" value={formatDateTime(selectedClaim.claim.fulfilledAt)} /> : null}
              <StateCard
                body={selectedClaim.canSendOtp ? "Send OTP to the contractor before physical delivery." : "This claim is not eligible for OTP from the current backend state."}
                title="OTP handoff"
                tone={selectedClaim.canSendOtp ? "warning" : "muted"}
              />
              <PrimaryButton disabled={busy || !selectedClaim.canSendOtp} label={busy ? "Sending" : "Send OTP"} onPress={() => void sendOtp()} />
              <FieldLabel label="OTP" />
              <TextInput keyboardType="number-pad" onChangeText={(value) => setOtp(value.replace(/\D/g, "").slice(0, 6))} placeholder="6 digit OTP" style={styles.input} value={otp} />
              <PrimaryButton disabled={!canMarkDelivered} label={busy ? "Delivering" : "Mark Delivered"} onPress={() => void markDelivered()} />
              <Text numberOfLines={2} style={styles.rowMeta}>Backend re-checks active Claim Raised before OTP and Delivered.</Text>
            </View>
          ) : null}
        </>
      ) : null}

      {visibleRewardSection === "HISTORY" ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reward History</Text>
          </View>
          <View style={styles.lightMetricRow}>
            <LightMetric compact label="Open history" value={String(openHistoryCount)} />
            <LightMetric compact label="Delivered history" value={String(deliveredHistoryCount)} />
          </View>
          {history.length === 0 ? <EmptyState title="No reward history yet." /> : null}
          {history.map((item) => (
            <View key={item.claim.rewardClaimId} style={styles.rewardHistoryRow}>
              <View style={styles.rowBody}>
                <View style={styles.entityHeaderRow}>
                  <Text numberOfLines={1} style={[styles.rowTitle, styles.entityTitleText]}>{item.contractor.name}</Text>
                  <Text numberOfLines={1} style={[styles.badge, item.claim.status === "FULFILLED" ? styles.badgeGood : styles.badgeWarn]}>
                    {compactClaimStatusLabel(item.claim.status)}
                  </Text>
                </View>
                <Text numberOfLines={1} style={styles.rowMeta}>{item.contractor.mobileNumber} · {item.claim.claimId}</Text>
                <View style={styles.rowFactStrip}>
                  <MiniFact label="Reward" value={item.claim.rewardName} />
                  <MiniFact label="Points" value={formatPoints(item.claim.pointsDeducted)} />
                </View>
                <Text numberOfLines={1} style={styles.rowMeta}>
                  Raised {formatDateTime(item.claim.chosenAt)}
                  {item.claim.fulfilledAt ? ` · Delivered ${formatDateTime(item.claim.fulfilledAt)}` : ""}
                </Text>
              </View>
            </View>
          ))}
        </>
      ) : null}

      <StatusText status={status} />
    </ScreenFrame>
  );
}

function StaffScreen() {
  const { session } = useAdminContext();
  const isManager = canUseManagerAction(session?.role ?? "STAFF");
  const [staff, setStaff] = useState<readonly StaffSummary[]>([]);
  const [staffDraft, setStaffDraft] = useState<PersonDraft>(emptyPersonDraft);
  const [staffMutation, setStaffMutation] = useState<StaffMutationResponse | null>(null);
  const [status, setStatus] = useState<StatusMessage>({ tone: "idle", message: "Loading staff" });
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!session) {
      return;
    }
    if (!isManager) {
      setStatus({ tone: "warning", message: "Staff management is manager-only." });
      return;
    }
    setStatus({ tone: "idle", message: "Loading staff" });
    try {
      const result = await listStaff(session.token);
      setStaff(result);
      setStatus({ tone: "success", message: `${result.length} staff users loaded` });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Staff failed" });
    }
  }

  useEffect(() => {
    void load();
  }, [isManager, session?.token]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function pickStaffDraftPhoto() {
    if (!isManager) {
      return;
    }
    setBusy(true);
    setStatus({ tone: "idle", message: "Choosing staff photo" });
    try {
      const image = await pickDeviceImage({ quality: 0.58 });
      if (!image) {
        setStatus({ tone: "idle", message: "Photo selection cancelled" });
        return;
      }
      setStaffDraft((current) => ({
        ...current,
        photoUrl: image.dataUrl,
        ...(image.fileName ? { photoFileName: image.fileName } : {}),
      }));
      setStatus({ tone: "success", message: "Staff photo ready" });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Photo selection failed" });
    } finally {
      setBusy(false);
    }
  }

  async function createStaffMember() {
    if (!session || !isManager) {
      return;
    }
    if (!staffDraft.name.trim() || staffDraft.mobileNumber.length !== 10) {
      setStatus({ tone: "danger", message: "Enter staff name and 10 digit mobile number." });
      return;
    }

    setBusy(true);
    setStatus({ tone: "idle", message: "Creating staff member" });
    try {
      const result = await createStaff(session.token, {
        name: staffDraft.name.trim(),
        mobileNumber: staffDraft.mobileNumber,
        ...(staffDraft.photoUrl ? { photoUrl: staffDraft.photoUrl } : {}),
      });
      setStaff((current) => upsertStaff(current, result.staff));
      setStaffDraft(emptyPersonDraft);
      setStaffMutation(result);
      setStatus({ tone: "success", message: `${result.staff.name} created. Temporary PIN ${result.temporaryPin}` });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Staff creation failed" });
    } finally {
      setBusy(false);
    }
  }

  async function pickStaffPhoto(staffMember: StaffSummary) {
    if (!session || !isManager) {
      return;
    }
    setBusy(true);
    setStatus({ tone: "idle", message: `Choosing photo for ${staffMember.name}` });
    try {
      const image = await pickDeviceImage({ quality: 0.58 });
      if (!image) {
        setStatus({ tone: "idle", message: "Photo selection cancelled" });
        return;
      }
      const updated = await updateStaffPhoto(session.token, staffMember.staffId, { photoUrl: image.dataUrl });
      setStaff((current) => upsertStaff(current, updated));
      setStaffMutation(null);
      setStatus({ tone: "success", message: "Staff photo updated" });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Staff photo failed" });
    } finally {
      setBusy(false);
    }
  }

  async function resetStaffMemberPin(staffMember: StaffSummary) {
    if (!session || !isManager) {
      return;
    }
    setBusy(true);
    setStatus({ tone: "idle", message: `Resetting PIN for ${staffMember.name}` });
    try {
      const result = await resetStaffPin(session.token, staffMember.staffId);
      setStaff((current) => upsertStaff(current, result.staff));
      setStaffMutation(result);
      setStatus({ tone: "success", message: `Temporary PIN ${result.temporaryPin} issued for ${result.staff.name}` });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "PIN reset failed" });
    } finally {
      setBusy(false);
    }
  }

  async function toggleStaffStatus(staffMember: StaffSummary) {
    if (!session || !isManager) {
      return;
    }
    setBusy(true);
    setStatus({ tone: "idle", message: staffMember.status === "ACTIVE" ? "Deactivating staff" : "Reactivating staff" });
    try {
      const updated = staffMember.status === "ACTIVE"
        ? await deactivateStaff(session.token, staffMember.staffId)
        : await reactivateStaff(session.token, staffMember.staffId);
      setStaff((current) => upsertStaff(current, updated));
      setStaffMutation(null);
      setStatus({ tone: "success", message: updated.status === "ACTIVE" ? "Staff reactivated" : "Staff deactivated" });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Staff status failed" });
    } finally {
      setBusy(false);
    }
  }

  const activeCount = staff.filter((staffMember) => staffMember.status === "ACTIVE").length;
  const inactiveCount = staff.length - activeCount;

  return (
    <ScreenFrame
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.color.primary} />}
    >
      <View style={styles.topBar}>
        <View style={styles.operatorCopy}>
          <Text style={styles.eyebrow}>{isManager ? `${session?.role ?? "ADMIN"} manager` : "Read only"}</Text>
          <Text numberOfLines={1} style={styles.screenTitle}>Staff</Text>
          <Text numberOfLines={2} style={styles.muted}>
            {isManager ? "Create staff, upload photos, reset PINs, and manage active status." : "Staff management is not available for this role."}
          </Text>
        </View>
      </View>

      <StateCard
        body={isManager
          ? "OWNER and ADMIN can manage Staff users from mobile. Admin-account management remains outside this screen."
          : "STAFF can use operational tabs but cannot create or change Staff users."}
        title={isManager ? "Manager controls" : "Manager-only screen"}
        tone={isManager ? "success" : "muted"}
      />

      {!isManager ? (
        <>
          <EmptyState title="No staff actions available" />
          <StatusText status={status} />
        </>
      ) : (
        <>
          <View style={styles.metricGrid}>
            <MetricTile label="Active" value={activeCount} />
            <MetricTile label="Inactive" value={inactiveCount} />
          </View>

          <View style={styles.formBlock}>
            <View style={styles.panelHeaderRow}>
              <View style={styles.rowBody}>
                <Text style={styles.sectionTitle}>Add staff</Text>
                <Text style={styles.rowMeta}>Name and mobile become the login identity for this Staff user.</Text>
              </View>
              <Text numberOfLines={1} style={[styles.badge, styles.badgeGood]}>{session?.role ?? "ADMIN"}</Text>
            </View>
            <FieldLabel label="Full name" />
            <TextInput
              autoCapitalize="words"
              onChangeText={(value) => setStaffDraft((current) => ({ ...current, name: value }))}
              placeholder="Aarti Deshmukh"
              style={styles.input}
              value={staffDraft.name}
            />
            <FieldLabel label="Mobile number" />
            <TextInput
              keyboardType="phone-pad"
              maxLength={10}
              onChangeText={(value) => setStaffDraft((current) => ({ ...current, mobileNumber: normalizeMobileInput(value) }))}
              placeholder="10 digit mobile"
              style={styles.input}
              value={staffDraft.mobileNumber}
            />
            {staffDraft.photoUrl ? (
              <View style={styles.photoPreviewRow}>
                <Image source={{ uri: staffDraft.photoUrl }} style={styles.avatar} />
                <Text numberOfLines={2} style={styles.rowMeta}>{staffDraft.photoFileName ?? "Staff photo selected"}</Text>
              </View>
            ) : null}
            <SecondaryButton disabled={busy} label={staffDraft.photoUrl ? "Change staff photo" : "Upload staff photo"} onPress={() => void pickStaffDraftPhoto()} />
            <PrimaryButton disabled={busy} label={busy ? "Saving" : "Create staff"} onPress={() => void createStaffMember()} />
            {staffMutation ? (
              <View style={styles.operationPanel}>
                <Text style={styles.operationTitle}>Temporary PIN issued</Text>
                <DetailRow label="Staff" value={staffMutation.staff.name} />
                <DetailRow label="PIN" value={staffMutation.temporaryPin} />
              </View>
            ) : null}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Staff directory</Text>
          </View>
          {staff.map((staffMember) => (
            <View key={staffMember.staffId} style={styles.staffCard}>
              <View style={styles.staffCardHeader}>
                <Avatar name={staffMember.name} {...(staffMember.photoUrl ? { photoUrl: staffMember.photoUrl } : {})} />
                <View style={styles.rowBody}>
                  <Text numberOfLines={1} style={styles.rowTitle}>{staffMember.name}</Text>
                  <Text numberOfLines={1} style={styles.rowMeta}>{staffMember.mobileNumber}</Text>
                  <Text numberOfLines={1} style={styles.rowMeta}>Created {formatDate(staffMember.createdAt)}</Text>
                </View>
                <Text style={[styles.badge, staffMember.status === "ACTIVE" ? styles.badgeGood : styles.badgeWarn]}>{staffMember.status}</Text>
              </View>
              <View style={styles.staffActionGrid}>
                <SecondaryButton disabled={busy} label="Photo" onPress={() => void pickStaffPhoto(staffMember)} />
                <SecondaryButton disabled={busy || staffMember.status !== "ACTIVE"} label="Reset PIN" onPress={() => void resetStaffMemberPin(staffMember)} />
                <DestructiveButton
                  disabled={busy}
                  label={staffMember.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                  onPress={() => void toggleStaffStatus(staffMember)}
                  tone={staffMember.status === "ACTIVE" ? "danger" : "warning"}
                />
              </View>
            </View>
          ))}
          {staff.length === 0 ? <EmptyState title="No staff users loaded" /> : null}
          <StatusText status={status} />
        </>
      )}
    </ScreenFrame>
  );
}

function ReportsScreen() {
  const { session } = useAdminContext();
  const isManager = canUseManagerAction(session?.role ?? "STAFF");
  const [landing, setLanding] = useState<AdminReportsLanding | null>(null);
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusMessage>({ tone: "idle", message: "Loading reports" });
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!session) {
      return;
    }
    setStatus({ tone: "idle", message: "Loading reports" });
    try {
      const result = await getReportsLanding(session.token);
      setLanding(result);
      setStatus({ tone: "success", message: "Reports loaded" });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Reports failed" });
    }
  }

  useEffect(() => {
    void load();
  }, [session?.token]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function downloadReportFile(reportId: AdminReportId, format: AdminReportExportFormat) {
    if (!session || !isManager) {
      setStatus({ tone: "warning", message: "Report downloads are manager-only." });
      return;
    }
    const downloadKey = `${reportId}-${format}`;
    setDownloadingReport(downloadKey);
    setStatus({ tone: "idle", message: `Preparing ${format}` });
    try {
      const file = await downloadReport(session.token, reportId, format);
      setStatus({ tone: "success", message: `${file.fileName} downloaded (${formatBytes(file.byteLength)})` });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Download failed" });
    } finally {
      setDownloadingReport(null);
    }
  }

  return (
    <ScreenFrame
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.color.primary} />}
    >
      <View style={styles.topBar}>
        <View style={styles.operatorCopy}>
          <Text style={styles.eyebrow}>{isManager ? `${session?.role ?? "ADMIN"} reports` : "Read only"}</Text>
          <Text numberOfLines={1} style={styles.screenTitle}>Reports</Text>
          <Text numberOfLines={2} style={styles.muted}>
            {isManager ? "Download operational reports from mobile." : "Review available reports; downloads are manager-only."}
          </Text>
        </View>
      </View>

      <StateCard
        body={isManager
          ? "Choose CSV for spreadsheet review or PDF for sharing outside the app. Email sharing has been removed from Admin Mobile."
          : "STAFF can see report availability, while CSV and PDF downloads stay with OWNER and ADMIN."}
        title={isManager ? "Download center" : "Report list"}
        tone={isManager ? "success" : "muted"}
      />

      {landing ? (
        <>
          <View style={styles.metricGrid}>
            {landing.cards.slice(0, 4).map((card) => (
              <ReportStatCard
                key={card.key}
                label={card.label}
                {...(card.meta ? { meta: card.meta } : {})}
                value={card.value}
              />
            ))}
          </View>
          <Text numberOfLines={2} style={styles.rowMeta}>
            Range {landing.resolvedRange.label} · generated {formatDateTime(landing.generatedAt)}
          </Text>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Report downloads</Text>
          </View>
          {landing.reportShortcuts.map((shortcut) => {
            const csvKey = `${shortcut.reportId}-CSV`;
            const pdfKey = `${shortcut.reportId}-PDF`;
            return (
              <View key={shortcut.reportId} style={styles.reportRow}>
                <View style={styles.rowBody}>
                  <View style={styles.entityHeaderRow}>
                    <Text numberOfLines={1} style={[styles.rowTitle, styles.entityTitleText]}>{shortcut.title}</Text>
                    {shortcut.metric ? <Text numberOfLines={1} style={styles.shortcutBadge}>{shortcut.metric}</Text> : null}
                  </View>
                  <Text numberOfLines={2} style={styles.rowMeta}>{shortcut.description}</Text>
                  <View style={styles.downloadActionRow}>
                    <ReportDownloadButton
                      disabled={!isManager || downloadingReport !== null}
                      label={downloadingReport === csvKey ? "CSV..." : "CSV"}
                      onPress={() => void downloadReportFile(shortcut.reportId, "CSV")}
                    />
                    <ReportDownloadButton
                      disabled={!isManager || downloadingReport !== null}
                      label={downloadingReport === pdfKey ? "PDF..." : "PDF"}
                      onPress={() => void downloadReportFile(shortcut.reportId, "PDF")}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </>
      ) : (
        <EmptyState title="Reports are loading" />
      )}
      <StatusText status={status} />
    </ScreenFrame>
  );
}

function ScreenFrame({
  children,
  refreshControl,
}: {
  readonly children: React.ReactNode;
  readonly refreshControl?: React.ReactElement<RefreshControlProps>;
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.screen}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

function TabGlyph({
  color,
  focused,
  routeName,
}: {
  readonly color: ColorValue;
  readonly focused: boolean;
  readonly routeName: keyof TabParamList;
}) {
  return <Feather color={color} name={adminTabIconName(routeName)} size={focused ? 23 : 21} />;
}

function PinVisibilityButton({ onPress, visible }: { readonly onPress: () => void; readonly visible: boolean }) {
  return (
    <Pressable
      accessibilityLabel={visible ? "Hide PIN" : "Show PIN"}
      accessibilityRole="button"
      accessibilityState={{ selected: visible }}
      onPress={onPress}
      style={styles.visibilityIconButton}
    >
      <Feather color={theme.color.primary} name={visible ? "eye-off" : "eye"} size={19} />
    </Pressable>
  );
}

function SegmentButton({ active, label, onPress }: { readonly active: boolean; readonly label: string; readonly onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.segmentButton, active ? styles.segmentButtonActive : null]}>
      <Text style={[styles.segmentText, active ? styles.segmentTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

function RewardSectionTabs({
  activeSection,
  isManager,
  onChange,
}: {
  readonly activeSection: AdminRewardSection;
  readonly isManager: boolean;
  readonly onChange: (section: AdminRewardSection) => void;
}) {
  const sections: readonly AdminRewardSection[] = isManager ? ["CLAIMS", "HISTORY"] : ["HISTORY"];

  return (
    <View style={styles.segment}>
      {sections.map((section) => (
        <SegmentButton
          active={activeSection === section}
          key={section}
          label={rewardSectionLabel(section)}
          onPress={() => onChange(section)}
        />
      ))}
    </View>
  );
}

function ReturnStep({ label, text }: { readonly label: string; readonly text: string }) {
  return (
    <View style={styles.returnStep}>
      <Text style={styles.returnStepLabel}>{label}</Text>
      <Text numberOfLines={3} style={styles.returnStepText}>{text}</Text>
    </View>
  );
}

function LightMetric({
  compact,
  emphasis,
  label,
  value,
}: {
  readonly compact?: boolean;
  readonly emphasis?: boolean;
  readonly label: string;
  readonly value: string;
}) {
  const wrapsTextValue = /[A-Za-z]/.test(value) && value.length > 7;

  return (
    <View style={[styles.lightMetric, compact ? styles.lightMetricCompact : null, emphasis ? styles.lightMetricEmphasis : null]}>
      <Text
        adjustsFontSizeToFit={!wrapsTextValue}
        minimumFontScale={0.76}
        numberOfLines={wrapsTextValue ? 2 : 1}
        style={[
          styles.lightMetricValue,
          wrapsTextValue ? styles.lightMetricValueWrap : null,
          emphasis ? styles.lightMetricValueEmphasis : null,
        ]}
      >
        {value}
      </Text>
      <Text numberOfLines={2} style={styles.lightMetricLabel}>{label}</Text>
    </View>
  );
}

function StateCard({
  body,
  title,
  tone,
}: {
  readonly body?: string;
  readonly title: string;
  readonly tone: "muted" | "success" | "warning" | "danger";
}) {
  return (
    <View style={[styles.stateCard, styles[`stateCard_${tone}`]]}>
      <StateGlyph tone={tone} compact />
      <View style={styles.rowBody}>
        <Text style={styles.stateTitle}>{title}</Text>
        {body ? <Text style={styles.stateBody}>{body}</Text> : null}
      </View>
    </View>
  );
}

function StateGlyph({
  compact,
  tone,
}: {
  readonly compact?: boolean;
  readonly tone: "muted" | "success" | "warning" | "danger";
}) {
  const glyph = tone === "success" ? "✓" : tone === "danger" ? "!" : tone === "warning" ? "!" : "i";

  return (
    <View style={[styles.stateGlyph, compact ? styles.stateGlyphCompact : null, styles[`stateGlyph_${tone}`]]}>
      <Text style={[styles.stateGlyphText, compact ? styles.stateGlyphTextCompact : null]}>{glyph}</Text>
    </View>
  );
}

function ReportStatCard({
  label,
  meta,
  value,
}: {
  readonly label: string;
  readonly meta?: string;
  readonly value: string | number;
}) {
  return (
    <View style={styles.metricTile}>
      <Text numberOfLines={1} style={styles.metricValue}>{value}</Text>
      <Text numberOfLines={2} style={styles.metricLabel}>{label}</Text>
      {meta ? <Text numberOfLines={1} style={styles.metricDetail}>{meta}</Text> : null}
    </View>
  );
}

function MiniFact({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <View style={styles.miniFact}>
      <Text numberOfLines={1} style={styles.miniFactLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.miniFactValue}>{value}</Text>
    </View>
  );
}

function FieldLabel({ label }: { readonly label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

function PrimaryButton({ disabled, label, onPress }: { readonly disabled?: boolean; readonly label: string; readonly onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: Boolean(disabled) }} disabled={disabled} onPress={onPress} style={[styles.primaryButton, disabled ? styles.disabled : null]}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({
  disabled,
  label,
  onPress,
}: {
  readonly disabled?: boolean;
  readonly label: string;
  readonly onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: Boolean(disabled) }} disabled={disabled} onPress={onPress} style={[styles.secondaryButton, disabled ? styles.disabled : null]}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function ReportDownloadButton({
  disabled,
  label,
  onPress,
}: {
  readonly disabled?: boolean;
  readonly label: string;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`Download ${label}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.downloadActionButton, disabled ? styles.disabled : null]}
    >
      <Feather color={theme.color.primary} name="download" size={15} />
      <Text style={styles.downloadActionText}>{label}</Text>
    </Pressable>
  );
}

function DestructiveButton({
  disabled,
  label,
  onPress,
  tone,
}: {
  readonly disabled?: boolean;
  readonly label: string;
  readonly onPress: () => void;
  readonly tone: "warning" | "danger";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.destructiveButton,
        tone === "danger" ? styles.destructiveButtonDanger : styles.destructiveButtonWarning,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text style={styles.destructiveButtonText}>{label}</Text>
    </Pressable>
  );
}

function MetricTile({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text numberOfLines={1} style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function MetricButton({
  detail,
  disabled,
  label,
  onPress,
  value,
}: {
  readonly detail: string;
  readonly disabled?: boolean;
  readonly label: string;
  readonly onPress: () => void;
  readonly value: number;
}) {
  return (
    <Pressable
      accessibilityLabel={`${label}: ${value}. ${detail}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.metricTile, styles.metricButton, disabled ? styles.disabled : null]}
    >
      <Text style={styles.metricValue}>{value}</Text>
      <Text numberOfLines={1} style={styles.metricLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.metricDetail}>{detail}</Text>
    </Pressable>
  );
}

function CompactQrStatus({ metrics }: { readonly metrics: AdminDashboard["metrics"] | undefined }) {
  const total = Math.max(1, metrics?.qrTotal ?? 0);
  const printed = metrics?.qrPrinted ?? 0;
  const scanned = metrics?.qrScanned ?? 0;
  const notPrinted = metrics?.qrNotPrinted ?? 0;
  const returned = (metrics?.qrCancelled ?? 0) + (metrics?.qrReversed ?? 0);
  const scanRate = Math.round((scanned / total) * 100);

  return (
    <View style={styles.qrStatusCard}>
      <View style={styles.qrStatusHeader}>
        <View style={styles.rowBody}>
          <Text style={styles.sectionTitle}>QR status</Text>
          <Text style={styles.rowMeta}>{scanRate}% scanned across printed and pending QR labels</Text>
        </View>
        <View style={styles.qrStatusIcon}>
          <Feather color={theme.color.primary} name="activity" size={20} />
        </View>
      </View>
      <View style={styles.qrStatusBar}>
        <View style={[styles.qrStatusBarSegment, styles.qrStatusBarPrinted, { flex: Math.max(printed, 1) }]} />
        <View style={[styles.qrStatusBarSegment, styles.qrStatusBarScanned, { flex: Math.max(scanned, 1) }]} />
        <View style={[styles.qrStatusBarSegment, styles.qrStatusBarReturned, { flex: Math.max(returned, 1) }]} />
      </View>
      <View style={styles.compactStatusGrid}>
        <CompactStatusCell iconName="printer" label="Printed" value={printed} tone="warning" />
        <CompactStatusCell iconName="check-circle" label="Scanned" value={scanned} tone="success" />
        <CompactStatusCell iconName="inbox" label="Ready" value={notPrinted} tone="muted" />
        <CompactStatusCell iconName="rotate-ccw" label="Returned" value={returned} tone="danger" />
      </View>
    </View>
  );
}

function CompactStatusCell({
  iconName,
  label,
  tone,
  value,
}: {
  readonly iconName: FeatherIconName;
  readonly label: string;
  readonly tone: "success" | "warning" | "danger" | "muted";
  readonly value: number;
}) {
  const iconColor =
    tone === "success"
      ? theme.color.success
      : tone === "warning"
        ? theme.color.warning
        : tone === "danger"
          ? theme.color.danger
          : theme.color.muted;

  return (
    <View style={styles.compactStatusCell}>
      <View style={[styles.compactStatusIcon, styles[`compactStatusIcon_${tone}`]]}>
        <Feather color={iconColor} name={iconName} size={15} />
      </View>
      <Text style={styles.compactStatusValue}>{value}</Text>
      <Text numberOfLines={1} style={styles.compactStatusLabel}>{label}</Text>
    </View>
  );
}

function StatusPill({
  label,
  tone,
  value,
}: {
  readonly label: string;
  readonly tone: "success" | "warning" | "danger" | "muted";
  readonly value: number;
}) {
  return (
    <View style={[styles.statusPill, styles[`statusPill_${tone}`]]}>
      <Text style={styles.statusPillValue}>{value}</Text>
      <Text numberOfLines={1} style={styles.statusPillLabel}>{label}</Text>
    </View>
  );
}

function DashboardActionCard({
  body,
  eyebrow,
  iconName,
  onPress,
  title,
}: {
  readonly body: string;
  readonly eyebrow: string;
  readonly iconName: FeatherIconName;
  readonly onPress: () => void;
  readonly title: string;
}) {
  return (
    <Pressable accessibilityLabel={title} accessibilityRole="button" onPress={onPress} style={styles.dashboardActionCard}>
      <View style={styles.actionIcon}>
        <Feather color={theme.color.primary} name={iconName} size={19} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text numberOfLines={1} style={styles.rowTitle}>{title}</Text>
        <Text numberOfLines={2} style={styles.rowMeta}>{body}</Text>
      </View>
      <Feather color={theme.color.primary} name="chevron-right" size={18} />
    </Pressable>
  );
}

function ActivityRow({
  action,
  actorRole,
  createdAt,
  targetType,
}: {
  readonly action: string;
  readonly actorRole: string;
  readonly createdAt: string;
  readonly targetType: string;
}) {
  return (
    <View style={styles.activityRow}>
      <View style={styles.rowBody}>
        <Text numberOfLines={1} style={styles.rowTitle}>{humanizeAction(action)}</Text>
        <Text numberOfLines={1} style={styles.rowMeta}>
          {actorRole} · {targetType}
        </Text>
      </View>
      <Text style={styles.rowDate}>{formatDate(createdAt)}</Text>
    </View>
  );
}

function Avatar({ large, name, photoUrl }: { readonly large?: boolean; readonly name: string; readonly photoUrl?: string }) {
  if (photoUrl) {
    return <Image source={{ uri: photoUrl }} style={large ? styles.avatarLarge : styles.avatar} />;
  }

  return (
    <View style={large ? styles.avatarLargeFallback : styles.avatarFallback}>
      <Text style={large ? styles.avatarLargeText : styles.avatarText}>{initials(name)}</Text>
    </View>
  );
}

function EmptyState({ title }: { readonly title: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
    </View>
  );
}

type StatusMessage = {
  readonly tone: "idle" | "success" | "warning" | "danger";
  readonly message: string;
};

function StatusText({ status }: { readonly status: StatusMessage }) {
  if (!status.message) {
    return null;
  }

  return <Text style={[styles.statusText, styles[`statusText_${status.tone}`]]}>{status.message}</Text>;
}

function useAdminContext(): AdminContextValue {
  const value = useContext(AdminContext);
  if (!value) {
    throw new Error("Admin context missing.");
  }
  return value;
}

type RootNavigation = {
  navigate: (screen: "ContractorDetail", params: { contractorId: string }) => void;
};

type ContractorDetailRoute = {
  readonly key: string;
  readonly name: "ContractorDetail";
  readonly params: {
    readonly contractorId: string;
  };
};

function humanizeAction(action: string): string {
  return action
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPoints(value: number): string {
  return `${new Intl.NumberFormat("en-IN").format(value)} points`;
}

function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeMobileInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

function claimStatusLabel(status: AdminRewardClaimLookup["claim"]["status"]): string {
  if (status === "CHOSEN") {
    return "Claim Raised";
  }
  if (status === "FULFILLED") {
    return "Delivered";
  }
  if (status === "CANCELLED_BY_CONTRACTOR") {
    return "Cancelled / Points Restored";
  }
  if (status === "REVOKED_DUE_TO_RETURN") {
    return "Revoked Due To Return";
  }
  return humanizeAction(status);
}

function compactClaimStatusLabel(status: AdminRewardClaimLookup["claim"]["status"]): string {
  if (status === "CHOSEN") {
    return "Claim Raised";
  }
  if (status === "FULFILLED") {
    return "Delivered";
  }
  if (status === "CANCELLED_BY_CONTRACTOR") {
    return "Cancelled";
  }
  if (status === "REVOKED_DUE_TO_RETURN") {
    return "Revoked";
  }
  return humanizeAction(status);
}

function rewardSectionLabel(section: AdminRewardSection): string {
  if (section === "CLAIMS") {
    return "Claim Desk";
  }
  return "History";
}

function formatSite(site: ContractorDetail["sites"][number]): string {
  return [site.flatOrApartmentNo, site.buildingName, site.area, site.city].filter(Boolean).join(", ");
}

function getReturnOperation(result: ReturnQrResult): ReturnQrMutationResponse["operation"] | undefined {
  return "operation" in result ? result.operation : undefined;
}

function returnStateTone(status: string): "muted" | "success" | "warning" | "danger" {
  if (status === "CANCELLED" || status === "REVERSED") {
    return "success";
  }
  if (status === "CAN_REVERSE" || status === "SCANNED_CLAIMED") {
    return "warning";
  }
  if (status === "CAN_CANCEL" || status === "PRINTED_UNCLAIMED" || status === "REPRINTED") {
    return "warning";
  }
  if (status === "EXPIRED" || status === "INVALID" || status === "REVOKED") {
    return "danger";
  }
  return "muted";
}

function adminTabIconName(routeName: keyof TabParamList): FeatherIconName {
  if (routeName === "Dashboard") {
    return "home";
  }
  if (routeName === "ReturnScan") {
    return "maximize";
  }
  if (routeName === "Contractors") {
    return "users";
  }
  if (routeName === "Rewards") {
    return "gift";
  }
  return "bar-chart-2";
}

function upsertStaff(
  items: readonly StaffSummary[],
  nextItem: StaffSummary,
): readonly StaffSummary[] {
  const nextItems = items.filter((item) => item.staffId !== nextItem.staffId);
  return [nextItem, ...nextItems].sort((left, right) => left.name.localeCompare(right.name));
}

async function pickDeviceImage(options: { readonly quality: number }): Promise<{
  readonly contentType: string;
  readonly dataUrl: string;
  readonly fileName?: string;
} | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library permission is required to upload an image.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: false,
    base64: true,
    quality: options.quality,
  });
  if (result.canceled) {
    return null;
  }

  const asset = result.assets?.[0];
  if (!asset?.base64) {
    throw new Error("Selected image could not be read. Please choose another image.");
  }

  const contentType = asset.mimeType ?? inferImageContentType(asset.fileName ?? asset.uri);
  if (!allowedDeviceImageContentTypes.has(contentType)) {
    throw new Error("Image must be PNG, JPG, or JPEG.");
  }
  if (base64ByteLength(asset.base64) > maxDeviceImageBytes) {
    throw new Error("Image must be under 2 MB.");
  }
  return {
    contentType,
    dataUrl: `data:${contentType};base64,${asset.base64}`,
    ...(asset.fileName ? { fileName: asset.fileName } : {}),
  };
}

function inferImageContentType(value?: string): string {
  const normalized = value?.toLowerCase() ?? "";
  if (normalized.endsWith(".png")) {
    return "image/png";
  }
  return "image/jpeg";
}

function base64ByteLength(base64: string): number {
  const normalized = base64.replace(/\s/g, "");
  const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((normalized.length * 3) / 4) - padding);
}

const styles = StyleSheet.create({
  webMobileStage: {
    alignItems: "center",
    backgroundColor: "#0E1718",
    flex: 1,
    justifyContent: "center",
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
    paddingVertical: 16,
    width: "100%",
  },
  webMobileDevice: {
    backgroundColor: theme.color.canvas,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 28,
    borderWidth: 1,
    flex: 1,
    maxWidth: 480,
    minWidth: 0,
    overflow: "hidden",
    width: "100%",
  },
  safeArea: {
    flex: 1,
    backgroundColor: theme.color.canvas,
    minWidth: 0,
    width: "100%",
  },
  offlineBanner: {
    backgroundColor: theme.color.danger,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  offlineBannerText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 16,
    textAlign: "center",
  },
  screen: {
    gap: 14,
    padding: 14,
    paddingBottom: 34,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    gap: 12,
    justifyContent: "center",
    minHeight: 420,
  },
  loginHeader: {
    gap: 10,
    paddingTop: 18,
  },
  adminBrandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  adminBrandMark: {
    alignItems: "center",
    backgroundColor: theme.color.primary,
    borderRadius: theme.radius.md,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  adminBrandMarkText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },
  appName: {
    color: theme.color.primary,
    fontSize: 16,
    fontWeight: "900",
  },
  loginTitle: {
    color: theme.color.text,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 32,
  },
  loginSubtitle: {
    color: theme.color.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  segment: {
    backgroundColor: "#E8F0F1",
    borderRadius: theme.radius.md,
    flexDirection: "row",
    padding: 4,
  },
  segmentButton: {
    alignItems: "center",
    borderRadius: theme.radius.sm,
    flex: 1,
    paddingVertical: 12,
  },
  segmentButtonActive: {
    backgroundColor: theme.color.surface,
    ...theme.shadow,
  },
  segmentText: {
    color: theme.color.muted,
    fontSize: 13,
    fontWeight: "900",
  },
  segmentTextActive: {
    color: theme.color.primary,
  },
  formBlock: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 9,
    padding: 16,
    ...theme.shadow,
  },
  mobileFormGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  mobileFormCell: {
    flexBasis: "30%",
    flexGrow: 1,
    minWidth: 96,
  },
  fieldLabel: {
    color: theme.color.text,
    fontSize: 13,
    fontWeight: "800",
  },
  input: {
    backgroundColor: "#F8FBFB",
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.color.text,
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  secretInputRow: {
    position: "relative",
  },
  secretInput: {
    paddingRight: 58,
  },
  visibilityIconButton: {
    alignItems: "center",
    borderColor: theme.color.line,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    position: "absolute",
    right: 8,
    top: 7,
    width: 42,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.color.primary,
    borderRadius: theme.radius.md,
    minHeight: 52,
    justifyContent: "center",
    marginTop: 6,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#EAF1F2",
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: theme.color.primary,
    fontSize: 14,
    fontWeight: "900",
  },
  destructiveButton: {
    alignItems: "center",
    borderRadius: theme.radius.md,
    minHeight: 52,
    justifyContent: "center",
  },
  destructiveButtonDanger: {
    backgroundColor: theme.color.danger,
  },
  destructiveButtonWarning: {
    backgroundColor: theme.color.warning,
  },
  destructiveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.62,
  },
  topBar: {
    alignItems: "center",
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
    ...theme.shadow,
  },
  operatorCopy: {
    flex: 1,
    paddingRight: 12,
  },
  operatorHeroCard: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 14,
    padding: 14,
    ...theme.shadow,
  },
  operatorHeroTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  adminIdentityRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 12,
    minWidth: 0,
  },
  operatorAvatar: {
    alignItems: "center",
    backgroundColor: theme.color.primary,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  operatorAvatarText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  operatorHeroMetrics: {
    flexDirection: "row",
    gap: 8,
  },
  eyebrow: {
    color: theme.color.accent,
    fontSize: 12,
    fontWeight: "900",
  },
  screenTitle: {
    color: theme.color.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 27,
  },
  operatorName: {
    color: theme.color.text,
    fontSize: 21,
    fontWeight: "900",
    lineHeight: 25,
  },
  muted: {
    color: theme.color.muted,
    fontSize: 14,
    lineHeight: 19,
  },
  smallButton: {
    backgroundColor: theme.color.primary,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  smallButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  heroPanel: {
    alignItems: "center",
    backgroundColor: theme.color.primary,
    borderRadius: theme.radius.lg,
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
    padding: 16,
    ...theme.shadow,
  },
  dashboardHeroPanel: {
    alignItems: "center",
    backgroundColor: theme.color.primary,
    borderRadius: theme.radius.lg,
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
    minHeight: 148,
    padding: 16,
    ...theme.shadow,
  },
  heroCopyColumn: {
    flex: 1,
    minWidth: 0,
  },
  heroLabel: {
    color: "#BFE7EA",
    fontSize: 13,
    fontWeight: "800",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 31,
  },
  heroValue: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
  },
  heroCopy: {
    color: "#E8F6F7",
    fontSize: 14,
    lineHeight: 20,
  },
  heroStatusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  heroStatusChip: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(255,255,255,0.28)",
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  heroIconBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(255,255,255,0.32)",
    borderRadius: 24,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  heroIconText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricTile: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 82,
    padding: 14,
    ...theme.shadow,
  },
  metricButton: {
    gap: 2,
  },
  metricValue: {
    color: theme.color.text,
    fontSize: 24,
    fontWeight: "900",
  },
  metricLabel: {
    color: theme.color.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  metricDetail: {
    color: theme.color.primary,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 3,
  },
  lightMetricRow: {
    flexDirection: "row",
    gap: 10,
  },
  lightMetric: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flex: 1,
    minHeight: 76,
    minWidth: 0,
    padding: 12,
  },
  lightMetricCompact: {
    minHeight: 66,
    padding: 10,
  },
  lightMetricEmphasis: {
    backgroundColor: theme.color.primarySoft,
    borderColor: theme.color.primary,
  },
  lightMetricValue: {
    color: theme.color.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 26,
  },
  lightMetricValueWrap: {
    fontSize: 18,
    lineHeight: 21,
  },
  lightMetricValueEmphasis: {
    color: theme.color.primary,
  },
  lightMetricLabel: {
    color: theme.color.muted,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    marginTop: 2,
  },
  sectionHeader: {
    marginTop: 4,
  },
  sectionTitle: {
    color: theme.color.text,
    fontSize: 17,
    fontWeight: "900",
  },
  qrStatusCard: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 12,
    padding: 14,
    ...theme.shadow,
  },
  qrStatusHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  qrStatusIcon: {
    alignItems: "center",
    backgroundColor: theme.color.primarySoft,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  qrStatusBar: {
    borderRadius: 999,
    flexDirection: "row",
    height: 8,
    overflow: "hidden",
  },
  qrStatusBarSegment: {
    height: 8,
  },
  qrStatusBarPrinted: {
    backgroundColor: "#F4C27D",
  },
  qrStatusBarScanned: {
    backgroundColor: theme.color.success,
  },
  qrStatusBarReturned: {
    backgroundColor: theme.color.danger,
  },
  compactStatusGrid: {
    flexDirection: "row",
    gap: 8,
  },
  compactStatusCell: {
    backgroundColor: "#F8FBFB",
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flex: 1,
    minWidth: 0,
    padding: 9,
  },
  compactStatusIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  compactStatusIcon_success: {
    backgroundColor: "#E6F5EE",
  },
  compactStatusIcon_warning: {
    backgroundColor: theme.color.accentSoft,
  },
  compactStatusIcon_danger: {
    backgroundColor: "#FDECEC",
  },
  compactStatusIcon_muted: {
    backgroundColor: "#EAF1F2",
  },
  compactStatusValue: {
    color: theme.color.text,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 7,
  },
  compactStatusLabel: {
    color: theme.color.muted,
    fontSize: 10,
    fontWeight: "900",
    marginTop: 1,
    textTransform: "uppercase",
  },
  statusStrip: {
    gap: 10,
  },
  statusPill: {
    alignItems: "center",
    borderRadius: theme.radius.md,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 14,
  },
  statusPill_success: {
    backgroundColor: "#E6F5EE",
  },
  statusPill_warning: {
    backgroundColor: theme.color.accentSoft,
  },
  statusPill_danger: {
    backgroundColor: "#FDECEC",
  },
  statusPill_muted: {
    backgroundColor: "#EAF1F2",
  },
  statusPillValue: {
    color: theme.color.text,
    fontSize: 20,
    fontWeight: "900",
  },
  statusPillLabel: {
    color: theme.color.muted,
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
  },
  actionBand: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 12,
    padding: 16,
    ...theme.shadow,
  },
  dashboardActionCard: {
    alignItems: "center",
    backgroundColor: "#F8FBFB",
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 76,
    padding: 12,
  },
  actionIcon: {
    alignItems: "center",
    backgroundColor: theme.color.primarySoft,
    borderRadius: theme.radius.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  actionIconText: {
    color: theme.color.primary,
    fontSize: 16,
    fontWeight: "900",
  },
  chevronText: {
    color: theme.color.primary,
    flexShrink: 0,
    fontSize: 16,
    fontWeight: "900",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  downloadActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  downloadActionButton: {
    alignItems: "center",
    backgroundColor: "#EAF1F2",
    borderColor: theme.color.line,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 12,
  },
  downloadActionText: {
    color: theme.color.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  actionChip: {
    backgroundColor: theme.color.accentSoft,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  actionChipText: {
    color: theme.color.warning,
    fontSize: 13,
    fontWeight: "900",
  },
  bodyText: {
    color: theme.color.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  stateCard: {
    alignItems: "center",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  stateCard_muted: {
    backgroundColor: "#EAF1F2",
    borderColor: theme.color.line,
  },
  stateCard_success: {
    backgroundColor: "#E6F5EE",
    borderColor: "#B5E2CD",
  },
  stateCard_warning: {
    backgroundColor: theme.color.accentSoft,
    borderColor: "#FFD7A8",
  },
  stateCard_danger: {
    backgroundColor: "#FDECEC",
    borderColor: "#F7B4AF",
  },
  stateTitle: {
    color: theme.color.text,
    fontSize: 15,
    fontWeight: "900",
  },
  stateBody: {
    color: theme.color.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  stateGlyph: {
    alignItems: "center",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  stateGlyphCompact: {
    borderRadius: 21,
    height: 42,
    width: 42,
  },
  stateGlyph_muted: {
    backgroundColor: "#DDE8EA",
  },
  stateGlyph_success: {
    backgroundColor: "#DDF3E9",
  },
  stateGlyph_warning: {
    backgroundColor: "#FFF0DF",
  },
  stateGlyph_danger: {
    backgroundColor: "#FDECEC",
  },
  stateGlyphText: {
    color: theme.color.primary,
    fontSize: 26,
    fontWeight: "900",
  },
  stateGlyphTextCompact: {
    fontSize: 20,
  },
  activityRow: {
    alignItems: "center",
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 14,
  },
  rowTitle: {
    color: theme.color.text,
    fontSize: 15,
    fontWeight: "900",
  },
  entityTitleText: {
    flex: 1,
    minWidth: 0,
  },
  rowMeta: {
    color: theme.color.muted,
    fontSize: 13,
    marginTop: 2,
  },
  rowDate: {
    color: theme.color.muted,
    flexShrink: 0,
    fontSize: 12,
    fontWeight: "800",
  },
  panelHeaderRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    minWidth: 0,
  },
  entityHeaderRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    minWidth: 0,
  },
  rowFactStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  miniFact: {
    backgroundColor: "#F8FBFB",
    borderColor: theme.color.line,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    flexBasis: "31%",
    flexGrow: 1,
    minHeight: 42,
    minWidth: 76,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  miniFactLabel: {
    color: theme.color.muted,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  miniFactValue: {
    color: theme.color.text,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2,
  },
  contractorRow: {
    alignItems: "center",
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  rewardMobileSummary: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 10,
    padding: 14,
    ...theme.shadow,
  },
  rewardMobileImage: {
    backgroundColor: "#EAF1F2",
    borderRadius: theme.radius.md,
    height: 150,
    resizeMode: "cover",
    width: "100%",
  },
  rewardMobileImageMissing: {
    alignItems: "center",
    backgroundColor: theme.color.primary,
    borderRadius: theme.radius.md,
    height: 126,
    justifyContent: "center",
    width: "100%",
  },
  rewardMobileRow: {
    alignItems: "center",
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 82,
    padding: 12,
    ...theme.shadow,
  },
  rewardClaimRow: {
    alignItems: "center",
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 92,
    padding: 12,
    ...theme.shadow,
  },
  rewardClaimRowSelected: {
    backgroundColor: theme.color.primarySoft,
    borderColor: theme.color.primary,
  },
  rewardHistoryRow: {
    alignItems: "flex-start",
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  rewardRowImage: {
    backgroundColor: "#EAF1F2",
    borderRadius: theme.radius.md,
    height: 56,
    resizeMode: "cover",
    width: 56,
  },
  rewardRowImagePlaceholder: {
    alignItems: "center",
    backgroundColor: theme.color.primary,
    borderRadius: theme.radius.md,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  rewardRowImageText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    borderRadius: 22,
    height: 44,
    width: 44,
  },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: theme.color.primary,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  avatarLarge: {
    borderRadius: 34,
    height: 68,
    width: 68,
  },
  avatarLargeFallback: {
    alignItems: "center",
    backgroundColor: theme.color.primary,
    borderRadius: 34,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  avatarLargeText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: theme.radius.sm,
    color: theme.color.muted,
    flexShrink: 0,
    fontSize: 11,
    fontWeight: "900",
    maxWidth: 104,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5,
    textAlign: "center",
  },
  badgeGood: {
    backgroundColor: "#E6F5EE",
    color: theme.color.success,
  },
  badgeWarn: {
    backgroundColor: "#FDECEC",
    color: theme.color.danger,
  },
  profileBand: {
    alignItems: "center",
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    padding: 16,
  },
  profileText: {
    flex: 1,
  },
  siteRow: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: 14,
  },
  deniedBox: {
    backgroundColor: "#FDECEC",
    borderColor: "#F7B4AF",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  deniedTitle: {
    color: theme.color.danger,
    fontSize: 15,
    fontWeight: "900",
  },
  scanPanel: {
    alignItems: "center",
    backgroundColor: theme.color.primaryDark,
    borderRadius: theme.radius.lg,
    gap: 10,
    minHeight: 190,
    justifyContent: "center",
    padding: 20,
  },
  scanLens: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 58,
    borderWidth: 1,
    height: 116,
    justifyContent: "center",
    width: 116,
  },
  scanMark: {
    borderColor: "#FFFFFF",
    borderRadius: theme.radius.md,
    borderWidth: 2,
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  scanEyebrow: {
    color: "#F9BF78",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  scanTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
  scanSubtitle: {
    color: "#D6EFF1",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 290,
    textAlign: "center",
  },
  returnStepStrip: {
    flexDirection: "row",
    gap: 8,
  },
  returnStep: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flex: 1,
    minHeight: 94,
    padding: 10,
  },
  returnStepLabel: {
    color: theme.color.accent,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  returnStepText: {
    color: theme.color.text,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    marginTop: 4,
  },
  cameraNotice: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: 14,
  },
  cameraNoticeText: {
    color: theme.color.muted,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  cameraPermissionCard: {
    backgroundColor: "#EEF8F7",
    borderColor: theme.color.primary,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  cameraScannerCard: {
    backgroundColor: "#071A1D",
    borderRadius: theme.radius.lg,
    gap: 10,
    overflow: "hidden",
    padding: 10,
  },
  cameraPreviewShell: {
    aspectRatio: 1,
    backgroundColor: "#071A1D",
    borderRadius: theme.radius.md,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  cameraPreview: {
    height: "100%",
    width: "100%",
  },
  cameraOverlay: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  cameraFrame: {
    borderColor: "#FFFFFF",
    borderRadius: theme.radius.md,
    borderWidth: 3,
    height: "62%",
    opacity: 0.92,
    width: "62%",
  },
  cameraScannerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  cameraScannerHint: {
    color: "#C8DDDF",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    paddingBottom: 4,
    textAlign: "center",
  },
  manualScanFallback: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  manualScanTitle: {
    color: theme.color.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  returnCard: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 14,
    padding: 16,
    ...theme.shadow,
  },
  returnCardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  returnCardCopy: {
    flex: 1,
    minWidth: 0,
  },
  returnProduct: {
    color: theme.color.text,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22,
    flex: 1,
  },
  returnBadge: {
    borderRadius: theme.radius.sm,
    maxWidth: 112,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  returnBadgeDanger: {
    backgroundColor: "#FDECEC",
  },
  returnBadgeWarning: {
    backgroundColor: theme.color.accentSoft,
  },
  returnBadgeSuccess: {
    backgroundColor: "#E6F5EE",
  },
  returnBadgeMuted: {
    backgroundColor: "#EAF1F2",
  },
  returnBadgeText: {
    color: theme.color.text,
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 15,
    textAlign: "center",
  },
  returnDetailGrid: {
    backgroundColor: "#F8FBFB",
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  detailRow: {
    alignItems: "flex-start",
    borderBottomColor: theme.color.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  detailLabel: {
    color: theme.color.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  detailValue: {
    color: theme.color.text,
    flex: 1.25,
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18,
    textAlign: "right",
  },
  contractorImpact: {
    backgroundColor: theme.color.primarySoft,
    borderRadius: theme.radius.md,
    gap: 2,
    padding: 12,
  },
  impactPanel: {
    backgroundColor: theme.color.accentSoft,
    borderColor: "#FFD7A8",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  impactPanelDanger: {
    backgroundColor: "#FDECEC",
    borderColor: "#F7B4AF",
  },
  claimList: {
    gap: 4,
    marginTop: 6,
  },
  warningTitle: {
    color: theme.color.text,
    fontSize: 13,
    fontWeight: "900",
  },
  warningCopy: {
    color: theme.color.danger,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  warningCopyNeutral: {
    color: theme.color.warning,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  claimLine: {
    color: theme.color.muted,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  nonActionPanel: {
    backgroundColor: "#F8FBFB",
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  returnWarningCard: {
    backgroundColor: theme.color.accentSoft,
    borderColor: "#FFD7A8",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  checkRow: {
    alignItems: "center",
    backgroundColor: "#F8FBFB",
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  checkbox: {
    alignItems: "center",
    borderColor: theme.color.primary,
    borderRadius: 4,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  checkboxChecked: {
    backgroundColor: theme.color.primary,
  },
  checkboxMark: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
  checkText: {
    color: theme.color.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
  },
  operationPanel: {
    backgroundColor: "#E6F5EE",
    borderColor: "#B5E2CD",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 5,
    padding: 12,
  },
  operationTitle: {
    color: theme.color.success,
    fontSize: 16,
    fontWeight: "900",
  },
  reportRow: {
    alignItems: "center",
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 14,
  },
  shortcutBadge: {
    backgroundColor: theme.color.primarySoft,
    borderRadius: theme.radius.sm,
    color: theme.color.primary,
    flexShrink: 0,
    fontSize: 11,
    fontWeight: "900",
    maxWidth: 112,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5,
    textAlign: "center",
  },
  reportChartCard: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 10,
    padding: 14,
    ...theme.shadow,
  },
  chartSegmentRow: {
    alignItems: "center",
    backgroundColor: "#F8FBFB",
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chartSegmentValue: {
    color: theme.color.primary,
    flexShrink: 0,
    fontSize: 18,
    fontWeight: "900",
    minWidth: 42,
    textAlign: "right",
  },
  reportPreviewPanel: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 12,
    padding: 14,
    ...theme.shadow,
  },
  reportSummaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  reportSummaryCell: {
    backgroundColor: "#F8FBFB",
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexBasis: "46%",
    flexGrow: 1,
    gap: 2,
    minHeight: 70,
    padding: 10,
  },
  reportPreviewRow: {
    backgroundColor: "#F8FBFB",
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    overflow: "hidden",
    paddingTop: 10,
  },
  staffCard: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 12,
    padding: 12,
    ...theme.shadow,
  },
  staffCardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  staffActionGrid: {
    gap: 8,
  },
  photoPreviewRow: {
    alignItems: "center",
    backgroundColor: "#F8FBFB",
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 10,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: "#EAF1F2",
    borderRadius: theme.radius.md,
    padding: 18,
  },
  emptyTitle: {
    color: theme.color.muted,
    fontSize: 14,
    fontWeight: "800",
  },
  statusText: {
    borderRadius: theme.radius.sm,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    padding: 10,
  },
  statusText_idle: {
    backgroundColor: "#EAF1F2",
    color: theme.color.muted,
  },
  statusText_success: {
    backgroundColor: "#E6F5EE",
    color: theme.color.success,
  },
  statusText_warning: {
    backgroundColor: theme.color.accentSoft,
    color: theme.color.warning,
  },
  statusText_danger: {
    backgroundColor: "#FDECEC",
    color: theme.color.danger,
  },
});
