import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
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
import { NavigationContainer, useNavigation, useRoute } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  getContractorDetail,
  getDashboard,
  getReport,
  getReportsLanding,
  fulfillRewardClaim,
  listRewardCatalog,
  listRewardClaimHistory,
  listRewardClaims,
  listContractors,
  listStaff,
  lookupRewardClaim,
  loginAdmin,
  addRewardCatalogImage,
  cancelReturnQr,
  createContractor,
  createStaff,
  deactivateContractor,
  createRewardCatalogItem,
  deactivateRewardCatalogItem,
  deactivateStaff,
  lookupReturnQr,
  reactivateContractor,
  reactivateRewardCatalogItem,
  reactivateStaff,
  resetContractorMpin,
  resetStaffPin,
  reverseReturnQr,
  sendRewardFulfillmentOtp,
  updateRewardCatalogItem,
  updateContractorPhoto,
  updateStaffPhoto,
  type AdminDashboard,
  type AdminReportId,
  type AdminReportResponse,
  type AdminReportsLanding,
  type AdminRole,
  type AdminRewardClaimHistoryEntry,
  type AdminRewardClaimLookup,
  type ContractorResetMpinResponse,
  type ContractorDetail,
  type ContractorSummary,
  type RewardCatalogItem,
  type RewardCatalogStatus,
  type RewardFulfillmentOtpResponse,
  type ReturnQrLookupResponse,
  type ReturnQrMutationResponse,
  type StaffMutationResponse,
  type StaffSummary,
} from "./src/api";
import { tabsForRole } from "./src/roleNavigation";
import { clearSession, getSession, saveSession, type StoredAdminSession } from "./src/storage";
import { theme } from "./src/theme";

type RootStackParamList = {
  Login: undefined;
  Tabs: undefined;
  ContractorDetail: { contractorId: string };
};

type TabParamList = {
  Dashboard: undefined;
  ReturnScan: undefined;
  Contractors: undefined;
  Rewards: undefined;
  Reports: undefined;
};

type ReturnQrResult = ReturnQrLookupResponse | ReturnQrMutationResponse;
type TabNavigation = {
  navigate: (screen: keyof TabParamList) => void;
};
type AdminRewardSection = "CLAIMS" | "HISTORY" | "CATALOG";
type AdminOperationsSection = "REPORTS" | "STAFF";

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

  const [session, setSession] = useState<StoredAdminSession | null>(null);
  const [loading, setLoading] = useState(true);

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

function LoginScreen() {
  const { setSession } = useAdminContext();
  const [role, setRole] = useState<AdminRole>("OWNER");
  const [mobileNumber, setMobileNumber] = useState("9000000091");
  const [pin, setPin] = useState("1111");
  const [showPin, setShowPin] = useState(false);
  const [status, setStatus] = useState<StatusMessage>({ tone: "idle", message: "" });
  const [submitting, setSubmitting] = useState(false);

  function selectRole(nextRole: AdminRole) {
    setRole(nextRole);
    setMobileNumber(nextRole === "OWNER" ? "9000000091" : "9000000092");
    setPin(nextRole === "OWNER" ? "1111" : "2222");
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
  const navigation = useNavigation() as TabNavigation;
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

  return (
    <ScreenFrame
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.color.primary} />}
    >
      <View style={styles.topBar}>
        <View style={styles.operatorCopy}>
          <Text style={styles.eyebrow}>{session?.role}</Text>
          <Text numberOfLines={1} style={styles.screenTitle}>{session?.name}</Text>
          <Text numberOfLines={1} style={styles.muted}>{session?.mobileNumber}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => void signOut()} style={styles.smallButton}>
          <Text style={styles.smallButtonText}>Logout</Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityLabel="Open Return Scan"
        accessibilityRole="button"
        onPress={() => navigation.navigate("ReturnScan")}
        style={styles.heroPanel}
      >
        <View style={styles.heroCopyColumn}>
          <Text numberOfLines={1} style={styles.heroLabel}>Primary operation</Text>
          <Text style={styles.heroTitle}>Return Scan</Text>
          <Text numberOfLines={2} style={styles.heroCopy}>Cancel unused QR or reverse points on returned products.</Text>
        </View>
        <View style={styles.heroIconBadge}>
          <Text style={styles.heroIconText}>QR</Text>
        </View>
      </Pressable>

      <View style={styles.metricGrid}>
        <MetricButton label="Contractors" value={metrics?.contractors ?? 0} detail="Open directory" onPress={() => navigation.navigate("Contractors")} />
        <MetricButton
          disabled={session?.role !== "OWNER"}
          label="Staff"
          value={metrics?.staff ?? 0}
          detail={session?.role === "OWNER" ? "Manage staff" : "Owner only"}
          onPress={() => navigation.navigate("Reports")}
        />
        <MetricButton label="Claims" value={metrics?.rewardClaims ?? 0} detail="Open Claim Desk" onPress={() => navigation.navigate("Rewards")} />
        <MetricButton label="Reversed" value={metrics?.qrReversed ?? 0} detail="Return Scan" onPress={() => navigation.navigate("ReturnScan")} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>QR status</Text>
      </View>
      <View style={styles.statusStrip}>
        <StatusPill label="Not printed" value={metrics?.qrNotPrinted ?? 0} tone="muted" />
        <StatusPill label="Printed" value={metrics?.qrPrinted ?? 0} tone="warning" />
        <StatusPill label="Scanned" value={metrics?.qrScanned ?? 0} tone="success" />
        <StatusPill label="Cancelled" value={metrics?.qrCancelled ?? 0} tone="danger" />
      </View>

      {session?.role === "OWNER" ? (
        <View style={styles.actionBand}>
          <Text style={styles.sectionTitle}>Owner controls</Text>
          <DashboardActionCard
            eyebrow="Claim Desk"
            title="Fulfill rewards"
            body="Send OTP, verify active claim, and mark Delivered."
            onPress={() => navigation.navigate("Rewards")}
          />
          <DashboardActionCard
            eyebrow="Directory"
            title="Contractors"
            body="Review contractor profiles, sites, points, and photos."
            onPress={() => navigation.navigate("Contractors")}
          />
          <DashboardActionCard
            eyebrow="Reports"
            title="Staff and exports"
            body="Open live reports and OWNER staff management."
            onPress={() => navigation.navigate("Reports")}
          />
        </View>
      ) : (
        <View style={styles.actionBand}>
          <Text style={styles.sectionTitle}>Staff access</Text>
          <Text style={styles.bodyText}>Contractor data is read-only. Reward fulfillment, staff management, and exports are OWNER-only.</Text>
          <DashboardActionCard
            eyebrow="Available"
            title="Return Scan"
            body="Lookup return labels and perform allowed QR return operations."
            onPress={() => navigation.navigate("ReturnScan")}
          />
          <DashboardActionCard
            eyebrow="Read only"
            title="Contractors"
            body="View contractor status, sites, and points."
            onPress={() => navigation.navigate("Contractors")}
          />
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent activity</Text>
      </View>
      {(dashboard?.recentActivity ?? []).slice(0, 5).map((activity, index) => (
        <ActivityRow
          key={activity.auditEventId || `${activity.action}-${activity.createdAt}-${index}`}
          action={activity.action}
          actorRole={activity.actorRole}
          createdAt={activity.createdAt}
          targetType={activity.targetType}
        />
      ))}
      {dashboard && dashboard.recentActivity.length === 0 ? <EmptyState title="No recent activity" /> : null}
      <StatusText status={status} />
    </ScreenFrame>
  );
}

function ReturnScanScreen() {
  const { session } = useAdminContext();
  const [token, setToken] = useState("");
  const [result, setResult] = useState<ReturnQrResult | null>(null);
  const [labelRemoved, setLabelRemoved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<StatusMessage>({
    tone: "idle",
    message: "",
  });

  async function lookup() {
    const qrToken = token.trim();
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
      <View style={styles.topBar}>
        <View style={styles.operatorCopy}>
          <Text style={styles.eyebrow}>Returned product</Text>
          <Text numberOfLines={1} style={styles.screenTitle}>Return Scan</Text>
          <Text numberOfLines={2} style={styles.muted}>Check QR status before cancel or reverse.</Text>
        </View>
      </View>
      <View style={styles.scanPanel}>
        <View style={styles.scanLens}>
          <Text style={styles.scanMark}>QR</Text>
        </View>
        <Text style={styles.scanTitle}>Returned product label</Text>
        <Text style={styles.scanSubtitle}>Scan status, cancel unused QR, or reverse collected points.</Text>
      </View>
      <FieldLabel label="QR token" />
      <TextInput
        autoCapitalize="none"
        onChangeText={setToken}
        placeholder="Paste or type QR token"
        style={styles.input}
        value={token}
      />
      <PrimaryButton disabled={busy} label={busy ? "Working" : "Lookup status"} onPress={() => void lookup()} />
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

  return (
    <View style={styles.returnCard}>
      <View style={styles.returnCardHeader}>
        <View style={styles.returnCardCopy}>
          <Text numberOfLines={1} style={styles.eyebrow}>{result.qr.invoiceNumber}</Text>
          <Text numberOfLines={2} style={styles.returnProduct}>{result.qr.productName}</Text>
          <Text numberOfLines={1} style={styles.rowMeta}>
            {result.qr.productSku ?? "QR unit"} · {result.qr.shortCode}
          </Text>
        </View>
        <ReturnStatusBadge status={operation?.type ?? result.status} />
      </View>

      <View style={styles.returnDetailGrid}>
        <DetailRow label="QR points" value={`Rs. ${result.qr.points}`} />
        <DetailRow label="Token" value={result.tokenStatus} />
        <DetailRow label="Printed" value={result.qr.printedAt ? formatDate(result.qr.printedAt) : "Not printed"} />
        <DetailRow label="Expires" value={result.qr.expiresAt ? formatDate(result.qr.expiresAt) : "--"} />
      </View>

      {result.contractor ? (
        <View style={styles.contractorImpact}>
          <Text style={styles.sectionTitle}>Contractor</Text>
          <DetailRow label="Name" value={result.contractor.name} />
          <DetailRow label="Mobile" value={result.contractor.mobileNumber} />
          <DetailRow label="Available" value={`Rs. ${result.contractor.pointsAvailable}`} />
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
      <DetailRow label="Reverse" value={`Rs. ${impact.pointsToReverse}`} />
      <DetailRow label="Current balance" value={`Rs. ${impact.currentBalance}`} />
      <DetailRow label="After QR reverse" value={`Rs. ${impact.projectedBalanceAfterQrReverse}`} />
      <DetailRow label="After claim impact" value={`Rs. ${impact.projectedBalanceAfterClaimRevocations}`} />
      {impact.claimsToRevoke.length > 0 ? (
        <View style={styles.claimList}>
          <Text style={styles.warningTitle}>Unfulfilled claims to revoke</Text>
          {impact.claimsToRevoke.map((claim) => (
            <Text key={claim.rewardClaimId} style={styles.claimLine}>
              {claim.claimId} · {claim.rewardName} · Rs. {claim.pointsDeducted}
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
        <Text style={styles.bodyText}>Balance after: Rs. {operation.balanceAfter}</Text>
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
  const isOwner = session?.role === "OWNER";

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
    if (!session || !isOwner) {
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

  return (
    <ScreenFrame
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.color.primary} />}
    >
      <View style={styles.topBar}>
        <View style={styles.operatorCopy}>
          <Text style={styles.eyebrow}>{session?.role === "OWNER" ? "Manage" : "Read only"}</Text>
          <Text numberOfLines={1} style={styles.screenTitle}>Contractors</Text>
          <Text numberOfLines={2} style={styles.muted}>{session?.role === "OWNER" ? "Registration and profile controls" : "View contractor status"}</Text>
        </View>
      </View>

      <View style={styles.metricGrid}>
        <MetricTile label="Active" value={activeCount} />
        <MetricTile label="Inactive" value={inactiveCount} />
        <MetricTile label="Sites" value={contractors.reduce((total, contractor) => total + contractor.siteCount, 0)} />
        <MetricTile label="Scans" value={contractors.reduce((total, contractor) => total + contractor.scanCount, 0)} />
      </View>

      {isOwner ? (
        <View style={styles.formBlock}>
          <Text style={styles.sectionTitle}>Register contractor</Text>
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
            <Text numberOfLines={1} style={styles.rowTitle}>{contractor.name}</Text>
            <Text numberOfLines={1} style={styles.rowMeta}>
              {contractor.contractorCode} · {contractor.mobileNumber}
            </Text>
            <Text numberOfLines={1} style={styles.rowMeta}>
              {contractor.availablePoints} points available · {contractor.siteCount} sites
            </Text>
          </View>
          <Text style={[styles.badge, contractor.status === "ACTIVE" ? styles.badgeGood : styles.badgeWarn]}>
            {contractor.status}
          </Text>
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
    if (!session || !detail || session.role !== "OWNER") {
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
    if (!session || !detail || session.role !== "OWNER") {
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
    if (!session || !detail || session.role !== "OWNER") {
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
              <Text numberOfLines={1} style={styles.screenTitle}>{detail.name}</Text>
              <Text numberOfLines={1} style={styles.muted}>{detail.mobileNumber}</Text>
              <Text numberOfLines={1} style={styles.muted}>{detail.contractorCode}</Text>
            </View>
          </View>
          {session?.role === "OWNER" ? (
            <View style={styles.actionBand}>
              <Text style={styles.sectionTitle}>Owner actions</Text>
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
          {session?.role === "STAFF" ? (
            <View style={styles.deniedBox}>
              <Text style={styles.deniedTitle}>Read-only access</Text>
              <Text style={styles.bodyText}>STAFF cannot edit, deactivate, change points, or manage rewards.</Text>
            </View>
          ) : null}
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

interface RewardDraft {
  readonly rewardId?: string;
  readonly code: string;
  readonly name: string;
  readonly quickDescription: string;
  readonly cashValueInr: string;
  readonly pointsRequired: string;
  readonly totalQuantity: string;
  readonly status: RewardCatalogStatus;
}

const emptyRewardDraft: RewardDraft = {
  code: "",
  name: "",
  quickDescription: "",
  cashValueInr: "",
  pointsRequired: "",
  totalQuantity: "",
  status: "DRAFT",
};

function toRewardDraft(item: RewardCatalogItem): RewardDraft {
  return {
    rewardId: item.rewardId,
    code: item.code,
    name: item.name,
    quickDescription: item.quickDescription,
    cashValueInr: String(item.cashValueInr),
    pointsRequired: String(item.pointsRequired),
    totalQuantity: String(item.totalQuantity),
    status: item.status,
  };
}

function RewardsScreen() {
  const { session } = useAdminContext();
  const isOwner = session?.role === "OWNER";
  const [items, setItems] = useState<readonly RewardCatalogItem[]>([]);
  const [claims, setClaims] = useState<readonly AdminRewardClaimLookup[]>([]);
  const [history, setHistory] = useState<readonly AdminRewardClaimHistoryEntry[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<AdminRewardClaimLookup | null>(null);
  const [draft, setDraft] = useState<RewardDraft>(emptyRewardDraft);
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
      const [nextClaims, nextHistory, nextItems] = await Promise.all([
        isOwner ? listRewardClaims(session.token) : Promise.resolve([]),
        listRewardClaimHistory(session.token),
        isOwner ? listRewardCatalog(session.token) : Promise.resolve([]),
      ]);
      setClaims(nextClaims);
      setHistory(nextHistory);
      setItems(nextItems);
      setSelectedClaim((current) => {
        if (!isOwner) {
          return null;
        }
        const currentClaim = current ? nextClaims.find((item) => item.claim.claimId === current.claim.claimId) : undefined;
        return currentClaim ?? nextClaims[0] ?? current;
      });
      setDraft((current) => {
        if (!isOwner) {
          return emptyRewardDraft;
        }
        const currentItem = current.rewardId ? nextItems.find((item) => item.rewardId === current.rewardId) : undefined;
        const itemToSelect = currentItem ?? nextItems[0];
        return itemToSelect ? toRewardDraft(itemToSelect) : emptyRewardDraft;
      });
      setStatus({ tone: "success", message: isOwner ? `${nextClaims.length} claims, ${nextHistory.length} history records` : `${nextHistory.length} history records` });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Rewards failed" });
    }
  }

  useEffect(() => {
    void load();
  }, [session?.token]);

  useEffect(() => {
    if (!isOwner && activeSection !== "HISTORY") {
      setActiveSection("HISTORY");
    }
  }, [activeSection, isOwner]);

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
      setOtp(result.delivery.mockOtp ?? "");
      await load();
      setStatus({ tone: "success", message: result.delivery.mockOtp ? `OTP sent. Local dev OTP: ${result.delivery.mockOtp}` : "OTP sent" });
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

  function editReward(item: RewardCatalogItem) {
    setDraft(toRewardDraft(item));
    setStatus({ tone: "idle", message: `${item.code} loaded` });
  }

  async function saveReward() {
    if (!session) {
      return;
    }
    setBusy(true);
    setStatus({ tone: "idle", message: "Saving reward" });
    try {
      const payload = {
        code: draft.code,
        name: draft.name,
        quickDescription: draft.quickDescription,
        cashValueInr: Number(draft.cashValueInr),
        pointsRequired: Number(draft.pointsRequired),
        totalQuantity: Number(draft.totalQuantity),
        status: draft.status,
      };
      const saved = draft.rewardId
        ? await updateRewardCatalogItem(session.token, draft.rewardId, payload)
        : await createRewardCatalogItem(session.token, payload);
      setItems((current) => upsertRewardCatalog(current, saved));
      editReward(saved);
      setStatus({ tone: "success", message: "Reward saved" });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Reward save failed" });
    } finally {
      setBusy(false);
    }
  }

  async function pickRewardImage() {
    if (!session || !draft.rewardId) {
      setStatus({ tone: "danger", message: "Save the reward before uploading an image." });
      return;
    }
    setBusy(true);
    setStatus({ tone: "idle", message: "Uploading image" });
    try {
      const image = await pickDeviceImage({ quality: 0.82 });
      if (!image) {
        setStatus({ tone: "idle", message: "Image selection cancelled" });
        return;
      }
      const updated = await addRewardCatalogImage(session.token, draft.rewardId, {
        fileName: image.fileName ?? `${draft.code || "reward"}.jpg`,
        contentType: image.contentType,
        dataUrl: image.dataUrl,
        altText: draft.name,
      });
      setItems((current) => upsertRewardCatalog(current, updated));
      editReward(updated);
      setStatus({ tone: "success", message: "Reward image uploaded" });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Image upload failed" });
    } finally {
      setBusy(false);
    }
  }

  async function toggleReward(item: RewardCatalogItem) {
    if (!session) {
      return;
    }
    setBusy(true);
    try {
      const updated = item.status === "ACTIVE"
        ? await deactivateRewardCatalogItem(session.token, item.rewardId)
        : await reactivateRewardCatalogItem(session.token, item.rewardId);
      setItems((current) => upsertRewardCatalog(current, updated));
      editReward(updated);
      setStatus({ tone: "success", message: updated.status === "ACTIVE" ? "Reward activated" : "Reward deactivated" });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Status update failed" });
    } finally {
      setBusy(false);
    }
  }

  const selected = draft.rewardId ? items.find((item) => item.rewardId === draft.rewardId) : undefined;
  const canMarkDelivered = Boolean(
    !busy &&
    otpResult &&
    otp.length === 6 &&
    selectedClaim?.claim.status === "CHOSEN",
  );

  return (
    <ScreenFrame
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.color.primary} />}
    >
      <View style={styles.topBar}>
        <View style={styles.operatorCopy}>
          <Text style={styles.eyebrow}>{isOwner ? "OWNER rewards" : "STAFF history"}</Text>
          <Text numberOfLines={1} style={styles.screenTitle}>Rewards</Text>
          <Text numberOfLines={2} style={styles.muted}>{isOwner ? "Fulfill reward claims, review history, and manage catalog." : "Review contractor reward developments."}</Text>
        </View>
      </View>

      <RewardSectionTabs activeSection={activeSection} isOwner={isOwner} onChange={setActiveSection} />

      {isOwner && activeSection === "CLAIMS" ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Claim Desk</Text>
          </View>
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
            }} style={styles.rewardClaimRow}>
              <View style={styles.rowBody}>
                <Text numberOfLines={1} style={styles.rowTitle}>{item.contractor.name}</Text>
                <Text numberOfLines={1} style={styles.rowMeta}>{item.contractor.mobileNumber} · {item.claim.claimId}</Text>
                <Text numberOfLines={1} style={styles.rowMeta}>{item.claim.rewardName} · Rs. {item.claim.pointsDeducted}</Text>
              </View>
              <Text style={[styles.badge, styles.badgeGood]}>Claim Raised</Text>
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
              <Text numberOfLines={1} style={styles.rowTitle}>{selectedClaim.claim.claimId}</Text>
              <DetailRow label="Status" value={claimStatusLabel(selectedClaim.claim.status)} />
              <DetailRow label="Contractor" value={selectedClaim.contractor.name} />
              <DetailRow label="Phone" value={selectedClaim.contractor.mobileNumber} />
              <DetailRow label="Reward" value={selectedClaim.claim.rewardName} />
              <DetailRow label="Rs spent" value={`Rs. ${selectedClaim.claim.pointsDeducted}`} />
              <DetailRow label="Raised" value={formatDateTime(selectedClaim.claim.chosenAt)} />
              {selectedClaim.claim.fulfilledAt ? <DetailRow label="Delivered" value={formatDateTime(selectedClaim.claim.fulfilledAt)} /> : null}
              <PrimaryButton disabled={busy || !selectedClaim.canSendOtp} label={busy ? "Sending" : "Send OTP"} onPress={() => void sendOtp()} />
              <FieldLabel label="OTP" />
              <TextInput keyboardType="number-pad" onChangeText={(value) => setOtp(value.replace(/\D/g, "").slice(0, 6))} placeholder="6 digit OTP" style={styles.input} value={otp} />
              <PrimaryButton disabled={!canMarkDelivered} label={busy ? "Delivering" : "Mark Delivered"} onPress={() => void markDelivered()} />
              <Text numberOfLines={2} style={styles.rowMeta}>Backend re-checks active Claim Raised before OTP and Delivered.</Text>
            </View>
          ) : null}
        </>
      ) : null}

      {activeSection === "HISTORY" ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reward History</Text>
          </View>
          {history.length === 0 ? <EmptyState title="No reward history yet." /> : null}
          {history.map((item) => (
            <View key={item.claim.rewardClaimId} style={styles.rewardHistoryRow}>
              <View style={styles.rowBody}>
                <Text numberOfLines={1} style={styles.rowTitle}>{item.contractor.name}</Text>
                <Text numberOfLines={1} style={styles.rowMeta}>{item.contractor.mobileNumber} · {item.claim.claimId}</Text>
                <Text numberOfLines={1} style={styles.rowMeta}>{item.claim.rewardName} · Rs. {item.claim.pointsDeducted}</Text>
                <Text numberOfLines={1} style={styles.rowMeta}>Raised {formatDateTime(item.claim.chosenAt)}</Text>
              </View>
              <Text style={[styles.badge, item.claim.status === "FULFILLED" ? styles.badgeGood : styles.badgeWarn]}>
                {claimStatusLabel(item.claim.status)}
              </Text>
            </View>
          ))}
        </>
      ) : null}

      {isOwner && activeSection === "CATALOG" ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Catalog Management</Text>
          </View>
          <View style={styles.formBlock}>
            <FieldLabel label="Reward code" />
            <TextInput autoCapitalize="characters" onChangeText={(value) => setDraft((current) => ({ ...current, code: value.toUpperCase() }))} placeholder="RW-TOOLBOX-01" style={styles.input} value={draft.code} />
            <FieldLabel label="Reward name" />
            <TextInput onChangeText={(value) => setDraft((current) => ({ ...current, name: value }))} placeholder="Premium Toolbox" style={styles.input} value={draft.name} />
            <FieldLabel label="Quick description" />
            <TextInput onChangeText={(value) => setDraft((current) => ({ ...current, quickDescription: value }))} placeholder="Short reward description" style={styles.input} value={draft.quickDescription} />
            <View style={styles.mobileFormGrid}>
              <View style={styles.mobileFormCell}>
                <FieldLabel label="Internal INR" />
                <TextInput keyboardType="number-pad" onChangeText={(value) => setDraft((current) => ({ ...current, cashValueInr: value.replace(/\D/g, "") }))} style={styles.input} value={draft.cashValueInr} />
              </View>
              <View style={styles.mobileFormCell}>
                <FieldLabel label="Points/Rs" />
                <TextInput keyboardType="number-pad" onChangeText={(value) => setDraft((current) => ({ ...current, pointsRequired: value.replace(/\D/g, "") }))} style={styles.input} value={draft.pointsRequired} />
              </View>
              <View style={styles.mobileFormCell}>
                <FieldLabel label="Quantity" />
                <TextInput keyboardType="number-pad" onChangeText={(value) => setDraft((current) => ({ ...current, totalQuantity: value.replace(/\D/g, "") }))} style={styles.input} value={draft.totalQuantity} />
              </View>
            </View>
            <View style={styles.segment}>
              {(["DRAFT", "ACTIVE", "INACTIVE"] as const).map((nextStatus) => (
                <SegmentButton
                  active={draft.status === nextStatus}
                  key={nextStatus}
                  label={nextStatus}
                  onPress={() => setDraft((current) => ({ ...current, status: nextStatus }))}
                />
              ))}
            </View>
            <PrimaryButton disabled={busy} label={busy ? "Saving" : "Save reward"} onPress={() => void saveReward()} />
            <SecondaryButton label="New reward" onPress={() => setDraft(emptyRewardDraft)} />
            <SecondaryButton
              disabled={busy || !draft.rewardId}
              label={draft.rewardId ? "Upload image" : "Save reward before image"}
              onPress={() => void pickRewardImage()}
            />
            {selected ? (
              <DestructiveButton
                disabled={busy}
                label={selected.status === "ACTIVE" ? "Deactivate reward" : "Activate reward"}
                onPress={() => void toggleReward(selected)}
                tone={selected.status === "ACTIVE" ? "warning" : "danger"}
              />
            ) : null}
          </View>

          {selected ? (
            <View style={styles.rewardMobileSummary}>
              {selected.imageUrl ? <Image source={{ uri: selected.imageUrl }} style={styles.rewardMobileImage} /> : null}
              <DetailRow label="Available" value={`${selected.availableQuantity} of ${selected.totalQuantity}`} />
              <DetailRow label="Reserved" value={String(selected.reservedQuantity)} />
              <DetailRow label="Delivered" value={String(selected.deliveredQuantity)} />
              <DetailRow label="Images" value={String(selected.images.length)} />
              {selected.readinessIssues.map((issue) => (
                <Text key={issue} style={styles.warningCopy}>{issue}</Text>
              ))}
            </View>
          ) : null}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Catalog</Text>
          </View>
          {items.map((item) => (
            <Pressable
              accessibilityLabel={`Edit reward ${item.name}`}
              accessibilityRole="button"
              key={item.rewardId}
              onPress={() => editReward(item)}
              style={styles.rewardMobileRow}
            >
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.rewardRowImage} />
              ) : (
                <View style={styles.rewardRowImagePlaceholder}>
                  <Text style={styles.rewardRowImageText}>IMG</Text>
                </View>
              )}
              <View style={styles.rowBody}>
                <Text numberOfLines={1} style={styles.rowTitle}>{item.name}</Text>
                <Text numberOfLines={1} style={styles.rowMeta}>{item.code} · Rs. {item.pointsRequired}</Text>
                <Text numberOfLines={1} style={styles.rowMeta}>Stock {item.availableQuantity}/{item.totalQuantity} · {item.images.length} images</Text>
              </View>
              <Text style={[styles.badge, item.status === "ACTIVE" ? styles.badgeGood : styles.badgeWarn]}>{item.status}</Text>
            </Pressable>
          ))}
        </>
      ) : null}
      <StatusText status={status} />
    </ScreenFrame>
  );
}

function ReportsScreen() {
  const { session } = useAdminContext();
  const isOwner = session?.role === "OWNER";
  const [activeSection, setActiveSection] = useState<AdminOperationsSection>("REPORTS");
  const [landing, setLanding] = useState<AdminReportsLanding | null>(null);
  const [selectedReport, setSelectedReport] = useState<AdminReportResponse | null>(null);
  const [staff, setStaff] = useState<readonly StaffSummary[]>([]);
  const [staffDraft, setStaffDraft] = useState<PersonDraft>(emptyPersonDraft);
  const [staffMutation, setStaffMutation] = useState<StaffMutationResponse | null>(null);
  const [status, setStatus] = useState<StatusMessage>({ tone: "idle", message: "Loading operations" });
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!session) {
      return;
    }
    setStatus({ tone: "idle", message: "Loading operations" });
    try {
      const [nextLanding, nextStaff] = await Promise.all([
        getReportsLanding(session.token),
        isOwner ? listStaff(session.token) : Promise.resolve([]),
      ]);
      setLanding(nextLanding);
      setStaff(nextStaff);
      setStatus({ tone: "success", message: isOwner ? "Reports and staff loaded" : "Reports loaded" });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Operations failed" });
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

  async function openReport(reportId: AdminReportId) {
    if (!session) {
      return;
    }
    setBusy(true);
    setStatus({ tone: "idle", message: "Loading report preview" });
    try {
      const report = await getReport(session.token, reportId);
      setSelectedReport(report);
      setStatus({ tone: "success", message: `${report.title} loaded` });
    } catch (error) {
      setStatus({ tone: "danger", message: error instanceof Error ? error.message : "Report failed" });
    } finally {
      setBusy(false);
    }
  }

  async function pickStaffDraftPhoto() {
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
    if (!session || !isOwner) {
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
    if (!session || !isOwner) {
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
    if (!session || !isOwner) {
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
    if (!session || !isOwner) {
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

  return (
    <ScreenFrame
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.color.primary} />}
    >
      <View style={styles.topBar}>
        <View style={styles.operatorCopy}>
          <Text style={styles.eyebrow}>{isOwner ? "OWNER operations" : "STAFF reports"}</Text>
          <Text numberOfLines={1} style={styles.screenTitle}>Reports</Text>
          <Text numberOfLines={2} style={styles.muted}>
            {isOwner ? "Live operational reports and staff controls for the retailer." : "View operational reports without export or staff controls."}
          </Text>
        </View>
      </View>

      <OperationsSectionTabs activeSection={activeSection} isOwner={isOwner} onChange={setActiveSection} />

      {activeSection === "REPORTS" ? (
        <>
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
                <Text style={styles.sectionTitle}>Report shortcuts</Text>
              </View>
              {landing.reportShortcuts.map((shortcut) => (
                <Pressable
                  accessibilityLabel={`Open ${shortcut.title}`}
                  accessibilityRole="button"
                  key={shortcut.reportId}
                  onPress={() => void openReport(shortcut.reportId)}
                  style={styles.reportRow}
                >
                  <View style={styles.rowBody}>
                    <Text numberOfLines={1} style={styles.rowTitle}>{shortcut.title}</Text>
                    <Text numberOfLines={2} style={styles.rowMeta}>{shortcut.description}</Text>
                    {shortcut.metric ? <Text numberOfLines={1} style={styles.metricDetail}>{shortcut.metric}</Text> : null}
                  </View>
                  <Text style={styles.chevronText}>{">"}</Text>
                </Pressable>
              ))}
            </>
          ) : (
            <EmptyState title="Reports are loading" />
          )}

          {selectedReport ? (
            <View style={styles.reportPreviewPanel}>
              <View>
                <Text style={styles.eyebrow}>Preview</Text>
                <Text numberOfLines={2} style={styles.sectionTitle}>{selectedReport.title}</Text>
                <Text style={styles.rowMeta}>{selectedReport.totalRows} rows · page {selectedReport.page}</Text>
              </View>
              <View style={styles.reportSummaryGrid}>
                {selectedReport.summary.slice(0, 4).map((item) => (
                  <View key={`${item.label}-${item.value}`} style={styles.reportSummaryCell}>
                    <Text numberOfLines={1} style={styles.metricDetail}>{item.label}</Text>
                    <Text numberOfLines={1} style={styles.rowTitle}>{item.value}</Text>
                    {item.meta ? <Text numberOfLines={1} style={styles.rowMeta}>{item.meta}</Text> : null}
                  </View>
                ))}
              </View>
              {selectedReport.rows.length === 0 ? <EmptyState title="No rows for this report" /> : null}
              {selectedReport.rows.slice(0, 6).map((row, index) => (
                <ReportPreviewRow
                  columns={selectedReport.columns}
                  index={index}
                  key={`${selectedReport.reportId}-${index}`}
                  row={row}
                />
              ))}
            </View>
          ) : null}
        </>
      ) : null}

      {activeSection === "STAFF" && isOwner ? (
        <>
          <View style={styles.formBlock}>
            <Text style={styles.sectionTitle}>Add staff</Text>
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
        </>
      ) : null}
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
  const label = routeName === "ReturnScan" ? "QR" : routeName.slice(0, 1).toUpperCase();
  return (
    <View style={[styles.tabGlyph, focused ? styles.tabGlyphActive : null, { borderColor: color }]}>
      <Text style={[styles.tabGlyphText, { color }]}>{label}</Text>
    </View>
  );
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
      <View style={styles.eyeShape}>
        <View style={styles.eyePupil} />
        {visible ? <View style={styles.eyeSlash} /> : null}
      </View>
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
  isOwner,
  onChange,
}: {
  readonly activeSection: AdminRewardSection;
  readonly isOwner: boolean;
  readonly onChange: (section: AdminRewardSection) => void;
}) {
  const sections: readonly AdminRewardSection[] = isOwner ? ["CLAIMS", "HISTORY", "CATALOG"] : ["HISTORY"];

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

function OperationsSectionTabs({
  activeSection,
  isOwner,
  onChange,
}: {
  readonly activeSection: AdminOperationsSection;
  readonly isOwner: boolean;
  readonly onChange: (section: AdminOperationsSection) => void;
}) {
  const sections: readonly AdminOperationsSection[] = isOwner ? ["REPORTS", "STAFF"] : ["REPORTS"];

  return (
    <View style={styles.segment}>
      {sections.map((section) => (
        <SegmentButton
          active={activeSection === section}
          key={section}
          label={section === "REPORTS" ? "Reports" : "Staff"}
          onPress={() => onChange(section)}
        />
      ))}
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

function ReportPreviewRow({
  columns,
  index,
  row,
}: {
  readonly columns: AdminReportResponse["columns"];
  readonly index: number;
  readonly row: AdminReportResponse["rows"][number];
}) {
  const visibleColumns = columns.slice(0, 4);
  return (
    <View style={styles.reportPreviewRow}>
      <Text style={styles.eyebrow}>Row {index + 1}</Text>
      {visibleColumns.map((column) => (
        <DetailRow key={column.key} label={column.label} value={formatReportCell(row[column.key])} />
      ))}
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
  onPress,
  title,
}: {
  readonly body: string;
  readonly eyebrow: string;
  readonly onPress: () => void;
  readonly title: string;
}) {
  return (
    <Pressable accessibilityLabel={title} accessibilityRole="button" onPress={onPress} style={styles.dashboardActionCard}>
      <View style={styles.actionIcon}>
        <Text style={styles.actionIconText}>{title.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text numberOfLines={1} style={styles.rowTitle}>{title}</Text>
        <Text numberOfLines={2} style={styles.rowMeta}>{body}</Text>
      </View>
      <Text style={styles.chevronText}>{">"}</Text>
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

function normalizeMobileInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

function formatReportCell(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "--";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "number") {
    return String(value);
  }
  return String(value);
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

function rewardSectionLabel(section: AdminRewardSection): string {
  if (section === "CLAIMS") {
    return "Claim Desk";
  }
  if (section === "CATALOG") {
    return "Catalog";
  }
  return "History";
}

function formatSite(site: ContractorDetail["sites"][number]): string {
  return [site.flatOrApartmentNo, site.buildingName, site.area, site.city].filter(Boolean).join(", ");
}

function getReturnOperation(result: ReturnQrResult): ReturnQrMutationResponse["operation"] | undefined {
  return "operation" in result ? result.operation : undefined;
}

function upsertRewardCatalog(
  items: readonly RewardCatalogItem[],
  nextItem: RewardCatalogItem,
): readonly RewardCatalogItem[] {
  const nextItems = items.filter((item) => item.rewardId !== nextItem.rewardId);
  return [nextItem, ...nextItems].sort((left, right) => left.name.localeCompare(right.name));
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
  eyeShape: {
    alignItems: "center",
    borderColor: theme.color.primary,
    borderRadius: 10,
    borderWidth: 2,
    height: 14,
    justifyContent: "center",
    transform: [{ scaleX: 1.35 }],
    width: 18,
  },
  eyePupil: {
    backgroundColor: theme.color.primary,
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  eyeSlash: {
    backgroundColor: theme.color.primary,
    height: 2,
    position: "absolute",
    transform: [{ rotate: "-38deg" }],
    width: 24,
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
  sectionHeader: {
    marginTop: 4,
  },
  sectionTitle: {
    color: theme.color.text,
    fontSize: 17,
    fontWeight: "900",
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
  tabGlyph: {
    alignItems: "center",
    borderRadius: 11,
    borderWidth: 1,
    height: 22,
    justifyContent: "center",
    minWidth: 24,
    paddingHorizontal: 5,
  },
  tabGlyphActive: {
    backgroundColor: theme.color.primarySoft,
  },
  tabGlyphText: {
    fontSize: 10,
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
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 25,
    flex: 1,
  },
  returnBadge: {
    borderRadius: theme.radius.sm,
    maxWidth: 132,
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
