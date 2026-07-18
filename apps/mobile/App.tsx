import { createElement, useEffect, useMemo, useState, type ReactNode } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  archiveSite,
  cancelRewardClaim,
  changeContractorMpin,
  commitScanCart,
  createSite,
  forgotContractorMpin,
  getBalanceBook,
  getRewardCatalog,
  getScanCart,
  listActivePromotions,
  listContractorSites,
  listScanHistory,
  listTeamMemberSites,
  loginContractor,
  redeemReward,
  requestTeamMemberOtp,
  scanQr,
  setContractorMpin,
  updateContractorProfilePhoto,
  updateSite,
  verifyTeamMemberOtp,
  type BalanceBookEntry,
  type CommitScanCartResult,
  type PromotionBanner,
  type PublicContractor,
  type RewardCatalogResponse,
  type RewardCatalogTile,
  type ScanCartSummary,
  type ScanHistoryEntry,
  type ScanReservationResult,
  type SiteInput,
  type SiteSummary,
  type TeamMemberOtpResponse,
} from "./src/api";
import { describeHistoryScope } from "./src/historyScope";
import { presentScanHistory, type HistoryFilter, type HistorySort } from "./src/historyPresentation";
import { getRuntimeMobileDevFeatures } from "./src/devFeatures";
import { nextLanguage, t, type CopyKey, type Language } from "./src/i18n";
import { selectFeaturedRewards, splitRewardCatalog, type RewardCatalogSections, type RewardsTab } from "./src/rewardPresentation";
import { applyScanBalance } from "./src/scanBalance";
import { shouldShowScanPoints } from "./src/scanPresentation";
import {
  getReservedScanCartItems,
  hasReservedScanCartItems,
  reservedScanCartItemCount,
  shouldResetScanSiteOnEntry,
  totalReservedScanCartPoints,
} from "./src/scanSiteWorkflow";
import {
  clearRecentContractor,
  clearSession,
  getLanguage,
  getRecentContractor,
  getSession,
  saveLanguage,
  saveRecentContractor,
  saveSession,
  type StoredRecentContractor,
  type StoredSession,
} from "./src/storage";
import { presentBalanceBook, type BalanceBookFilter, type BalanceBookSort } from "./src/balanceBookPresentation";
import { statusTone, theme, type StatusTone } from "./src/theme";

type Persona = "CONTRACTOR" | "TEAM_MEMBER";
type ViewKey = "home" | "scan" | "sites" | "history" | "rewards";
type ScanFailureViewModel = {
  readonly body: string;
  readonly siteLabel?: string;
  readonly title: string;
  readonly tone: "danger" | "warning";
};

type ScanSuccessViewModel = {
  readonly actorLabel: string;
  readonly result: ScanReservationResult;
  readonly showPoints: boolean;
  readonly siteLabel: string;
};
type CartCommitNotice = {
  readonly balanceAfter: number;
  readonly pointsCredited: number;
  readonly siteLabel: string;
};

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();
const ContractorTabs = createBottomTabNavigator();
const TeamMemberStack = createNativeStackNavigator();
const TeamMemberTabs = createBottomTabNavigator();
const isWebRuntime = Platform.OS === "web";

const emptySiteForm: SiteInput = {
  clientName: "",
  flatOrApartmentNo: "",
  buildingName: "",
  area: "",
  city: "",
};

export default function App() {
  useWebDocumentReset();

  const [language, setLanguage] = useState<Language>("en");
  const [persona, setPersona] = useState<Persona>("CONTRACTOR");
  const [session, setSessionState] = useState<StoredSession | null>(null);
  const [recentContractor, setRecentContractorState] = useState<StoredRecentContractor | null>(null);
  const [sites, setSites] = useState<readonly SiteSummary[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [history, setHistory] = useState<readonly ScanHistoryEntry[]>([]);
  const [rewardCatalog, setRewardCatalog] = useState<RewardCatalogResponse | null>(null);
  const [balanceBook, setBalanceBook] = useState<readonly BalanceBookEntry[]>([]);
  const [promotions, setPromotions] = useState<readonly PromotionBanner[]>([]);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const tr = (key: CopyKey) => t(language, key);

  useEffect(() => {
    void hydrate();
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }
    void refreshSitesAndHistory(session);
  }, [session]);

  const activeSite = useMemo(
    () => sites.find((site) => site.siteId === selectedSiteId && site.status === "ACTIVE"),
    [sites, selectedSiteId],
  );

  async function hydrate(): Promise<void> {
    const [storedLanguage, storedRecent, storedSession] = await Promise.all([
      getLanguage(),
      getRecentContractor(),
      getSession(),
    ]);
    if (storedLanguage) {
      setLanguage(storedLanguage);
    }
    if (storedRecent) {
      setRecentContractorState(storedRecent);
    }
    if (storedSession && new Date(storedSession.expiresAt) > new Date()) {
      setSessionState(storedSession);
      setPersona(storedSession.role);
    }
  }

  async function switchLanguage(): Promise<void> {
    const next = nextLanguage(language);
    setLanguage(next);
    await saveLanguage(next);
  }

  async function setSession(nextSession: StoredSession): Promise<void> {
    setSessionState(nextSession);
    await saveSession(nextSession);
  }

  async function logout(): Promise<void> {
    setSessionState(null);
    setSites([]);
    setHistory([]);
    setRewardCatalog(null);
    setBalanceBook([]);
    setPromotions([]);
    setSelectedSiteId("");
    await clearSession();
  }

  async function refreshSitesAndHistory(currentSession = session): Promise<void> {
    if (!currentSession) {
      return;
    }
    await runTask(async () => {
      const [nextSites, nextHistory, nextRewards, nextBalanceBook, nextPromotions] = await Promise.all([
        currentSession.role === "TEAM_MEMBER"
          ? listTeamMemberSites(currentSession.token)
          : listContractorSites(currentSession.token),
        listScanHistory(currentSession.token, { limit: 50 }),
        currentSession.role === "CONTRACTOR" ? getRewardCatalog(currentSession.token) : Promise.resolve(null),
        currentSession.role === "CONTRACTOR" ? getBalanceBook(currentSession.token, { limit: 50 }) : Promise.resolve(null),
        listActivePromotions(currentSession.token),
      ]);
      setSites(nextSites);
      setHistory(nextHistory);
      setRewardCatalog(nextRewards);
      setBalanceBook(nextBalanceBook?.entries ?? []);
      setPromotions(nextPromotions);
      if (nextRewards) {
        await updateSessionFromRewardBalance(currentSession, nextRewards);
      }
      if (selectedSiteId && !nextSites.some((site) => site.siteId === selectedSiteId && site.status === "ACTIVE")) {
        setSelectedSiteId("");
      }
    }, false);
  }

  async function updateBalanceFromCartCommit(result: CommitScanCartResult): Promise<void> {
    if (!session) {
      return;
    }
    const nextSession = applyScanBalance(session, result);
    setSessionState(nextSession);
    await saveSession(nextSession);
  }

  async function updateSessionFromRewardBalance(
    currentSession: StoredSession,
    rewards: RewardCatalogResponse | { readonly currentTier: string; readonly totalAccumulatedPoints: number; readonly pointsAvailable: number },
  ): Promise<void> {
    if (
      currentSession.contractor.tier === rewards.currentTier &&
      currentSession.contractor.totalAccumulatedPoints === rewards.totalAccumulatedPoints &&
      currentSession.contractor.availablePoints === rewards.pointsAvailable
    ) {
      return;
    }
    const nextSession: StoredSession = {
      ...currentSession,
      contractor: {
        ...currentSession.contractor,
        tier: rewards.currentTier,
        totalAccumulatedPoints: rewards.totalAccumulatedPoints,
        availablePoints: rewards.pointsAvailable,
      },
    };
    setSessionState(nextSession);
    await saveSession(nextSession);
  }

  async function refreshRewards(currentSession = session): Promise<void> {
    if (!currentSession || currentSession.role !== "CONTRACTOR") {
      return;
    }
    const [nextRewards, nextBook] = await Promise.all([
      getRewardCatalog(currentSession.token),
      getBalanceBook(currentSession.token, { limit: 50 }),
    ]);
    setRewardCatalog(nextRewards);
    setBalanceBook(nextBook.entries);
    await updateSessionFromRewardBalance(currentSession, nextRewards);
  }

  async function runTask(task: () => Promise<void>, showSuccess = true): Promise<void> {
    setLoading(true);
    setError("");
    setStatus("");
    try {
      await task();
      if (showSuccess) {
        setStatus(tr("success"));
      }
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : tr("error"));
    } finally {
      setLoading(false);
    }
  }

  const appShell = (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primaryDark} />
      <View style={styles.app}>
        <NavigationContainer>
          {!session ? (
            <AuthNavigator
              tr={tr}
              language={language}
              onSwitchLanguage={switchLanguage}
              persona={persona}
              setPersona={setPersona}
              recentContractor={recentContractor}
              setRecentContractorState={setRecentContractorState}
              setSession={setSession}
              runTask={runTask}
            />
          ) : session.role === "TEAM_MEMBER" ? (
            <TeamMemberNavigator
              tr={tr}
              language={language}
              onSwitchLanguage={switchLanguage}
              session={session}
              sites={sites}
              selectedSiteId={selectedSiteId}
              setSelectedSiteId={setSelectedSiteId}
              activeSite={activeSite}
              history={history}
              promotions={promotions}
              runTask={runTask}
              refreshSitesAndHistory={refreshSitesAndHistory}
              updateBalanceFromCartCommit={updateBalanceFromCartCommit}
              onLogout={logout}
            />
          ) : (
            <ContractorNavigator
              tr={tr}
              language={language}
              onSwitchLanguage={switchLanguage}
              session={session}
              sites={sites}
              selectedSiteId={selectedSiteId}
              setSelectedSiteId={setSelectedSiteId}
              activeSite={activeSite}
              history={history}
              rewardCatalog={rewardCatalog}
              balanceBook={balanceBook}
              promotions={promotions}
              runTask={runTask}
              refreshSitesAndHistory={refreshSitesAndHistory}
              updateBalanceFromCartCommit={updateBalanceFromCartCommit}
              refreshRewards={refreshRewards}
              updateSessionFromRewardBalance={updateSessionFromRewardBalance}
              onSessionChanged={setSession}
              onLogout={logout}
            />
          )}
        </NavigationContainer>
        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={theme.colors.surface} />
            <Text style={styles.loadingText}>{tr("loading")}</Text>
          </View>
        ) : null}
        {status || error ? <Toast tone={error ? "danger" : "success"} message={error || status} /> : null}
      </View>
    </SafeAreaView>
  );

  if (!isWebRuntime) {
    return appShell;
  }

  return appShell;
}

function useWebDocumentReset(): void {
  useEffect(() => {
    if (!isWebRuntime || typeof document === "undefined") {
      return;
    }

    if (document.getElementById("volt-mobile-web-reset")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "volt-mobile-web-reset";
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

function AuthNavigator(props: {
  readonly tr: (key: CopyKey) => string;
  readonly language: Language;
  readonly onSwitchLanguage: () => void;
  readonly persona: Persona;
  readonly setPersona: (persona: Persona) => void;
  readonly recentContractor: StoredRecentContractor | null;
  readonly setRecentContractorState: (recent: StoredRecentContractor | null) => void;
  readonly setSession: (session: StoredSession) => Promise<void>;
  readonly runTask: (task: () => Promise<void>, showSuccess?: boolean) => Promise<void>;
}) {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="AuthHome">
        {() => (
          <AuthScreen
            tr={props.tr}
            language={props.language}
            onSwitchLanguage={props.onSwitchLanguage}
            persona={props.persona}
            setPersona={props.setPersona}
            recentContractor={props.recentContractor}
            setRecentContractorState={props.setRecentContractorState}
            setSession={props.setSession}
            runTask={props.runTask}
          />
        )}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

function AuthScreen(props: {
  readonly tr: (key: CopyKey) => string;
  readonly language: Language;
  readonly onSwitchLanguage: () => void;
  readonly persona: Persona;
  readonly setPersona: (persona: Persona) => void;
  readonly recentContractor: StoredRecentContractor | null;
  readonly setRecentContractorState: (recent: StoredRecentContractor | null) => void;
  readonly setSession: (session: StoredSession) => Promise<void>;
  readonly runTask: (task: () => Promise<void>, showSuccess?: boolean) => Promise<void>;
}) {
  return (
    <>
      <Header language={props.language} onSwitchLanguage={props.onSwitchLanguage} title={props.tr("appName")} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.screenContentInset}>
          <AuthWelcome tr={props.tr} persona={props.persona} />
          <PersonaSelector persona={props.persona} setPersona={props.setPersona} tr={props.tr} />
          {props.persona === "CONTRACTOR" ? (
            <ContractorLogin
              tr={props.tr}
              onAuthenticated={(contractor, authSession) =>
                props.setSession(toStoredSession("CONTRACTOR", contractor, authSession.token, authSession.expiresAt))
              }
              runTask={props.runTask}
            />
          ) : (
            <TeamMemberLogin
              tr={props.tr}
              recentContractor={props.recentContractor}
              setRecentContractorState={props.setRecentContractorState}
              onAuthenticated={async (contractor, authSession) => {
                const recent = toRecentContractor(contractor);
                await saveRecentContractor(recent);
                props.setRecentContractorState(recent);
                await props.setSession(
                  toStoredSession(
                    "TEAM_MEMBER",
                    contractor,
                    authSession.token,
                    authSession.expiresAt,
                    authSession.actor.teamMemberMobile,
                  ),
                );
              }}
              runTask={props.runTask}
            />
          )}
        </View>
      </ScrollView>
    </>
  );
}

function ContractorNavigator(props: {
  readonly tr: (key: CopyKey) => string;
  readonly language: Language;
  readonly onSwitchLanguage: () => void;
  readonly session: StoredSession;
  readonly sites: readonly SiteSummary[];
  readonly selectedSiteId: string;
  readonly setSelectedSiteId: (siteId: string) => void;
  readonly activeSite: SiteSummary | undefined;
  readonly history: readonly ScanHistoryEntry[];
  readonly rewardCatalog: RewardCatalogResponse | null;
  readonly balanceBook: readonly BalanceBookEntry[];
  readonly promotions: readonly PromotionBanner[];
  readonly runTask: (task: () => Promise<void>, showSuccess?: boolean) => Promise<void>;
  readonly refreshSitesAndHistory: () => Promise<void>;
  readonly updateBalanceFromCartCommit: (result: CommitScanCartResult) => Promise<void>;
  readonly refreshRewards: (session?: StoredSession | null) => Promise<void>;
  readonly updateSessionFromRewardBalance: (
    session: StoredSession,
    rewards: { readonly currentTier: string; readonly totalAccumulatedPoints: number; readonly pointsAvailable: number },
  ) => Promise<void>;
  readonly onSessionChanged: (session: StoredSession) => Promise<void>;
  readonly onLogout: () => void;
}) {
  return (
    <AppStack.Navigator screenOptions={stackScreenOptions}>
      <AppStack.Screen name="ContractorTabs" options={{ headerShown: false }}>
        {({ navigation }: any) => <ContractorTabsNavigator {...props} appNavigation={navigation} />}
      </AppStack.Screen>
      <AppStack.Screen name="Sites" options={{ title: props.tr("yourSites") }}>
        {({ navigation }: any) => (
          <StackScroll>
            <SitesView
              tr={props.tr}
              session={props.session}
              sites={props.sites}
              selectedSiteId={props.selectedSiteId}
              setSelectedSiteId={props.setSelectedSiteId}
              onAddSite={() => navigation.navigate("SiteForm")}
              onSelectSite={(siteId) => {
                props.setSelectedSiteId(siteId);
                navigation.navigate("ContractorTabs", { screen: "Dashboard" });
              }}
              onOpenSite={(siteId) => navigation.navigate("SiteDetail", { siteId })}
            />
          </StackScroll>
        )}
      </AppStack.Screen>
      <AppStack.Screen name="SiteDetail" options={{ title: props.tr("siteDetail") }}>
        {({ route, navigation }: any) => (
          <StackScroll>
            <SiteDetailView
              tr={props.tr}
              session={props.session}
              siteId={route.params?.siteId}
              sites={props.sites}
              selectedSiteId={props.selectedSiteId}
              setSelectedSiteId={props.setSelectedSiteId}
              runTask={props.runTask}
              refreshSitesAndHistory={props.refreshSitesAndHistory}
              onEdit={(siteId) => navigation.navigate("SiteForm", { siteId })}
            />
          </StackScroll>
        )}
      </AppStack.Screen>
      <AppStack.Screen name="SiteForm" options={{ title: props.tr("siteForm") }}>
        {({ route, navigation }: any) => (
          <StackScroll>
            <SiteFormView
              tr={props.tr}
              session={props.session}
              siteId={route.params?.siteId}
              sites={props.sites}
              setSelectedSiteId={props.setSelectedSiteId}
              runTask={props.runTask}
              refreshSitesAndHistory={props.refreshSitesAndHistory}
              onSaved={() => navigation.navigate("ContractorTabs", { screen: "Dashboard" })}
            />
          </StackScroll>
        )}
      </AppStack.Screen>
      <AppStack.Screen name="Profile" options={{ title: props.tr("profile") }}>
        {() => (
          <StackScroll>
            <ProfileView tr={props.tr} session={props.session} onLogout={props.onLogout} onSessionChanged={props.onSessionChanged} />
          </StackScroll>
        )}
      </AppStack.Screen>
      <AppStack.Screen name="RewardDetail" options={{ title: props.tr("rewardDetail") }}>
        {({ route }: any) => (
          <StackScroll>
            <RewardDetailScreen
              tr={props.tr}
              session={props.session}
              rewardId={route.params?.rewardId}
              catalog={props.rewardCatalog}
              runTask={props.runTask}
              refreshRewards={props.refreshRewards}
              updateSessionFromRewardBalance={props.updateSessionFromRewardBalance}
            />
          </StackScroll>
        )}
      </AppStack.Screen>
      <AppStack.Screen name="BalanceBook" options={{ title: props.tr("balanceBook") }}>
        {({ navigation }: any) => (
          <StackScroll>
            <BalanceBookView tr={props.tr} entries={props.balanceBook} onOpenEntry={(ledgerEntryId) => navigation.navigate("BalanceBookDetail", { ledgerEntryId })} />
          </StackScroll>
        )}
      </AppStack.Screen>
      <AppStack.Screen name="HistoryDetail" options={{ title: props.tr("scanDetail") }}>
        {({ route, navigation }: any) => (
          <StackScroll>
            <HistoryDetailView
              tr={props.tr}
              entry={props.history.find((item) => item.scanAttemptId === route.params?.scanAttemptId)}
              sessionRole={props.session.role}
              onAddToAccount={() => navigation.navigate("ContractorTabs", { screen: "Scan" })}
            />
          </StackScroll>
        )}
      </AppStack.Screen>
      <AppStack.Screen name="BalanceBookDetail" options={{ title: props.tr("ledgerDetail") }}>
        {({ route }: any) => (
          <StackScroll>
            <BalanceBookDetailView
              tr={props.tr}
              entry={props.balanceBook.find((item) => item.ledgerEntryId === route.params?.ledgerEntryId)}
            />
          </StackScroll>
        )}
      </AppStack.Screen>
      <AppStack.Screen name="ScanSuccess" options={{ title: props.tr("success") }}>
        {({ route, navigation }: any) => (
          <StackScroll>
            <ScanResultPanel result={route.params?.success} tr={props.tr} onScanAnother={() => navigation.goBack()} />
          </StackScroll>
        )}
      </AppStack.Screen>
      <AppStack.Screen name="ScanFailure" options={{ title: props.tr("scanFailed") }}>
        {({ route, navigation }: any) => (
          <StackScroll>
            <ScanFailurePanel failure={route.params?.failure} tr={props.tr} onScanAnother={() => navigation.goBack()} />
          </StackScroll>
        )}
      </AppStack.Screen>
    </AppStack.Navigator>
  );
}

function ContractorTabsNavigator(props: {
  readonly tr: (key: CopyKey) => string;
  readonly language: Language;
  readonly onSwitchLanguage: () => void;
  readonly session: StoredSession;
  readonly sites: readonly SiteSummary[];
  readonly selectedSiteId: string;
  readonly setSelectedSiteId: (siteId: string) => void;
  readonly activeSite: SiteSummary | undefined;
  readonly history: readonly ScanHistoryEntry[];
  readonly rewardCatalog: RewardCatalogResponse | null;
  readonly balanceBook: readonly BalanceBookEntry[];
  readonly promotions: readonly PromotionBanner[];
  readonly runTask: (task: () => Promise<void>, showSuccess?: boolean) => Promise<void>;
  readonly refreshSitesAndHistory: () => Promise<void>;
  readonly updateBalanceFromCartCommit: (result: CommitScanCartResult) => Promise<void>;
  readonly refreshRewards: (session?: StoredSession | null) => Promise<void>;
  readonly updateSessionFromRewardBalance: (
    session: StoredSession,
    rewards: { readonly currentTier: string; readonly totalAccumulatedPoints: number; readonly pointsAvailable: number },
  ) => Promise<void>;
  readonly onLogout: () => void;
  readonly appNavigation: any;
}) {
  const [reservedCartItemCount, setReservedCartItemCount] = useState(0);
  const [cartGuardVisible, setCartGuardVisible] = useState(false);
  function enterScanWorkflow(): void {
    if (shouldResetScanSiteOnEntry(reservedCartItemCount)) {
      props.setSelectedSiteId("");
    }
    setCartGuardVisible(false);
  }
  const guardedTabListeners = (routeName: string) => ({
    tabPress: (event: { readonly preventDefault: () => void }) => {
      if (routeName !== "Scan" && reservedCartItemCount > 0) {
        event.preventDefault();
        setCartGuardVisible(true);
      }
    },
  });

  return (
    <ContractorTabs.Navigator
      initialRouteName="Dashboard"
      backBehavior="history"
      screenOptions={({ route }: any) => tabScreenOptions(route.name, props.tr)}
    >
      <ContractorTabs.Screen name="Dashboard" listeners={guardedTabListeners("Dashboard")}>
        {({ navigation }: any) => (
          <TopLevelScreen language={props.language} onSwitchLanguage={props.onSwitchLanguage} session={props.session} tr={props.tr}>
            <DashboardView
              tr={props.tr}
              session={props.session}
              sites={props.sites}
              selectedSiteId={props.selectedSiteId}
              history={props.history}
              catalog={props.rewardCatalog}
              promotion={props.promotions[0]}
              onScan={() => {
                enterScanWorkflow();
                navigation.navigate("Scan");
              }}
              onBalanceBook={() => props.appNavigation.navigate("BalanceBook")}
              onSites={() => props.appNavigation.navigate("Sites")}
              onHistory={() => navigation.navigate("History")}
              onRewards={() => navigation.navigate("Rewards")}
              onProfile={() => props.appNavigation.navigate("Profile")}
            />
          </TopLevelScreen>
        )}
      </ContractorTabs.Screen>
      <ContractorTabs.Screen name="Scan" listeners={{ tabPress: () => enterScanWorkflow() }}>
        {() => (
          <TopLevelScreen language={props.language} onSwitchLanguage={props.onSwitchLanguage} session={props.session} tr={props.tr}>
            <ScanView
              tr={props.tr}
              session={props.session}
              sites={props.sites}
              selectedSiteId={props.selectedSiteId}
              setSelectedSiteId={props.setSelectedSiteId}
              activeSite={props.activeSite}
              runTask={props.runTask}
              refreshSitesAndHistory={props.refreshSitesAndHistory}
              updateBalanceFromCartCommit={props.updateBalanceFromCartCommit}
              onCartStateChange={(count) => {
                setReservedCartItemCount(count);
                if (count === 0) {
                  setCartGuardVisible(false);
                }
              }}
              cartGuardVisible={cartGuardVisible}
              onDismissCartGuard={() => setCartGuardVisible(false)}
              onScanFailure={(failure) => props.appNavigation.navigate("ScanFailure", { failure })}
              onScanSuccess={(success) => props.appNavigation.navigate("ScanSuccess", { success })}
            />
          </TopLevelScreen>
        )}
      </ContractorTabs.Screen>
      <ContractorTabs.Screen name="History" listeners={guardedTabListeners("History")}>
        {() => (
          <TopLevelScreen language={props.language} onSwitchLanguage={props.onSwitchLanguage} session={props.session} tr={props.tr}>
            <HistoryView
              tr={props.tr}
              session={props.session}
              history={props.history}
              onOpenDetail={(scanAttemptId) => props.appNavigation.navigate("HistoryDetail", { scanAttemptId })}
            />
          </TopLevelScreen>
        )}
      </ContractorTabs.Screen>
      <ContractorTabs.Screen name="Rewards" listeners={guardedTabListeners("Rewards")}>
        {() => (
          <TopLevelScreen language={props.language} onSwitchLanguage={props.onSwitchLanguage} session={props.session} tr={props.tr}>
            <RewardsView
              tr={props.tr}
              session={props.session}
              catalog={props.rewardCatalog}
              balanceBook={props.balanceBook}
              openReward={(rewardId) => props.appNavigation.navigate("RewardDetail", { rewardId })}
              openBalanceBook={() => props.appNavigation.navigate("BalanceBook")}
            />
          </TopLevelScreen>
        )}
      </ContractorTabs.Screen>
    </ContractorTabs.Navigator>
  );
}

function TeamMemberNavigator(props: {
  readonly tr: (key: CopyKey) => string;
  readonly language: Language;
  readonly onSwitchLanguage: () => void;
  readonly session: StoredSession;
  readonly sites: readonly SiteSummary[];
  readonly selectedSiteId: string;
  readonly setSelectedSiteId: (siteId: string) => void;
  readonly activeSite: SiteSummary | undefined;
  readonly history: readonly ScanHistoryEntry[];
  readonly promotions: readonly PromotionBanner[];
  readonly runTask: (task: () => Promise<void>, showSuccess?: boolean) => Promise<void>;
  readonly refreshSitesAndHistory: () => Promise<void>;
  readonly updateBalanceFromCartCommit: (result: CommitScanCartResult) => Promise<void>;
  readonly onLogout: () => void;
}) {
  return (
    <TeamMemberStack.Navigator screenOptions={stackScreenOptions}>
      <TeamMemberStack.Screen name="TeamMemberTabs" options={{ headerShown: false }}>
        {({ navigation }: any) => <TeamMemberTabsNavigator {...props} appNavigation={navigation} />}
      </TeamMemberStack.Screen>
      <TeamMemberStack.Screen name="ScanSuccess" options={{ title: props.tr("success") }}>
        {({ route, navigation }: any) => (
          <StackScroll>
            <ScanResultPanel result={route.params?.success} tr={props.tr} onScanAnother={() => navigation.goBack()} />
          </StackScroll>
        )}
      </TeamMemberStack.Screen>
      <TeamMemberStack.Screen name="ScanFailure" options={{ title: props.tr("scanFailed") }}>
        {({ route, navigation }: any) => (
          <StackScroll>
            <ScanFailurePanel failure={route.params?.failure} tr={props.tr} onScanAnother={() => navigation.goBack()} />
          </StackScroll>
        )}
      </TeamMemberStack.Screen>
      <TeamMemberStack.Screen name="HistoryDetail" options={{ title: props.tr("scanDetail") }}>
        {({ route, navigation }: any) => (
          <StackScroll>
            <HistoryDetailView
              tr={props.tr}
              entry={props.history.find((item) => item.scanAttemptId === route.params?.scanAttemptId)}
              sessionRole={props.session.role}
              onAddToAccount={() => navigation.navigate("TeamMemberTabs", { screen: "Scan" })}
            />
          </StackScroll>
        )}
      </TeamMemberStack.Screen>
    </TeamMemberStack.Navigator>
  );
}

function TeamMemberTabsNavigator(props: {
  readonly tr: (key: CopyKey) => string;
  readonly language: Language;
  readonly onSwitchLanguage: () => void;
  readonly session: StoredSession;
  readonly sites: readonly SiteSummary[];
  readonly selectedSiteId: string;
  readonly setSelectedSiteId: (siteId: string) => void;
  readonly activeSite: SiteSummary | undefined;
  readonly history: readonly ScanHistoryEntry[];
  readonly promotions: readonly PromotionBanner[];
  readonly runTask: (task: () => Promise<void>, showSuccess?: boolean) => Promise<void>;
  readonly refreshSitesAndHistory: () => Promise<void>;
  readonly updateBalanceFromCartCommit: (result: CommitScanCartResult) => Promise<void>;
  readonly onLogout: () => void;
  readonly appNavigation: any;
}) {
  const [reservedCartItemCount, setReservedCartItemCount] = useState(0);
  const [cartGuardVisible, setCartGuardVisible] = useState(false);
  function enterScanWorkflow(): void {
    if (shouldResetScanSiteOnEntry(reservedCartItemCount)) {
      props.setSelectedSiteId("");
    }
    setCartGuardVisible(false);
  }
  const guardedTabListeners = (routeName: string) => ({
    tabPress: (event: { readonly preventDefault: () => void }) => {
      if (routeName !== "Scan" && reservedCartItemCount > 0) {
        event.preventDefault();
        setCartGuardVisible(true);
      }
    },
  });

  return (
    <TeamMemberTabs.Navigator
      initialRouteName="Scan"
      backBehavior="history"
      screenOptions={({ route }: any) => tabScreenOptions(route.name, props.tr)}
    >
      <TeamMemberTabs.Screen name="Scan" listeners={{ tabPress: () => enterScanWorkflow() }}>
        {() => (
          <TopLevelScreen language={props.language} onSwitchLanguage={props.onSwitchLanguage} session={props.session} tr={props.tr}>
            <TeamMemberLanding
              session={props.session}
              tr={props.tr}
              activeSite={props.activeSite}
              promotion={props.promotions[0]}
              onLogout={props.onLogout}
            />
            <ScanView
              tr={props.tr}
              session={props.session}
              sites={props.sites}
              selectedSiteId={props.selectedSiteId}
              setSelectedSiteId={props.setSelectedSiteId}
              activeSite={props.activeSite}
              runTask={props.runTask}
              refreshSitesAndHistory={props.refreshSitesAndHistory}
              updateBalanceFromCartCommit={props.updateBalanceFromCartCommit}
              onCartStateChange={(count) => {
                setReservedCartItemCount(count);
                if (count === 0) {
                  setCartGuardVisible(false);
                }
              }}
              cartGuardVisible={cartGuardVisible}
              onDismissCartGuard={() => setCartGuardVisible(false)}
              onScanFailure={(failure) => props.appNavigation.navigate("ScanFailure", { failure })}
              onScanSuccess={(success) => props.appNavigation.navigate("ScanSuccess", { success })}
            />
          </TopLevelScreen>
        )}
      </TeamMemberTabs.Screen>
      <TeamMemberTabs.Screen name="History" listeners={guardedTabListeners("History")}>
        {() => (
          <TopLevelScreen language={props.language} onSwitchLanguage={props.onSwitchLanguage} session={props.session} tr={props.tr}>
            <TeamMemberLanding
              session={props.session}
              tr={props.tr}
              activeSite={props.activeSite}
              promotion={props.promotions[0]}
              onLogout={props.onLogout}
            />
            <HistoryView
              tr={props.tr}
              session={props.session}
              history={props.history}
              onOpenDetail={(scanAttemptId) => props.appNavigation.navigate("HistoryDetail", { scanAttemptId })}
            />
          </TopLevelScreen>
        )}
      </TeamMemberTabs.Screen>
    </TeamMemberTabs.Navigator>
  );
}

function TopLevelScreen(props: {
  readonly language: Language;
  readonly onSwitchLanguage: () => void;
  readonly session: StoredSession;
  readonly tr: (key: CopyKey) => string;
  readonly children: ReactNode;
}) {
  return (
    <>
      <Header language={props.language} onSwitchLanguage={props.onSwitchLanguage} title={props.tr("appName")} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.screenContentInset}>{props.children}</View>
      </ScrollView>
    </>
  );
}

function StackScroll(props: { readonly children: ReactNode }) {
  return (
    <ScrollView contentContainerStyle={styles.stackScrollContent}>
      <View style={styles.screenContentInset}>{props.children}</View>
    </ScrollView>
  );
}

const stackScreenOptions = {
  headerBackTitle: "Back",
  headerStyle: { backgroundColor: theme.colors.surface },
  headerTintColor: theme.colors.primaryDark,
  headerTitleStyle: { color: theme.colors.ink, fontWeight: "800" as const },
};

function tabScreenOptions(routeName: string, tr: (key: CopyKey) => string) {
  const labels: Record<string, CopyKey> = {
    Dashboard: "home",
    Scan: "scan",
    History: "history",
    Rewards: "rewards",
  };
  return {
    headerShown: false,
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: theme.colors.muted,
    tabBarLabel: tr(labels[routeName] ?? "home"),
    tabBarStyle: styles.navTabBar,
    tabBarLabelStyle: styles.navTabLabel,
    tabBarIcon: ({ focused }: { readonly focused: boolean }) => <TabGlyph routeName={routeName} focused={focused} />,
  };
}

function TabGlyph(props: { readonly focused: boolean; readonly routeName: string }) {
  const active = props.focused;
  const lineStyle = active ? styles.tabGlyphLineActive : styles.tabGlyphLine;

  if (props.routeName === "Scan") {
    return (
      <View style={[styles.navTabIcon, active ? styles.navTabIconActive : undefined]}>
        <View style={styles.tabGlyphGrid}>
          {[0, 1, 2, 3].map((cell) => (
            <View key={cell} style={[styles.tabGlyphQrCell, active ? styles.tabGlyphQrCellActive : undefined]} />
          ))}
        </View>
      </View>
    );
  }

  if (props.routeName === "History") {
    return (
      <View style={[styles.navTabIcon, active ? styles.navTabIconActive : undefined]}>
        <View style={[styles.tabGlyphClock, lineStyle]}>
          <View style={[styles.tabGlyphClockHandVertical, lineStyle]} />
          <View style={[styles.tabGlyphClockHandHorizontal, lineStyle]} />
        </View>
      </View>
    );
  }

  if (props.routeName === "Rewards") {
    return (
      <View style={[styles.navTabIcon, active ? styles.navTabIconActive : undefined]}>
        <View style={[styles.tabGlyphGiftLid, lineStyle]} />
        <View style={[styles.tabGlyphGiftBox, lineStyle]}>
          <View style={[styles.tabGlyphGiftRibbon, active ? styles.tabGlyphRibbonActive : undefined]} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.navTabIcon, active ? styles.navTabIconActive : undefined]}>
      <View style={[styles.tabGlyphHomeRoof, active ? styles.tabGlyphHomeRoofActive : undefined]} />
      <View style={[styles.tabGlyphHomeBody, lineStyle]} />
    </View>
  );
}

function Header(props: {
  readonly language: Language;
  readonly onSwitchLanguage: () => void;
  readonly title: string;
  readonly subtitle?: string;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.brandBolt}>
          <Text style={styles.brandBoltText}>V</Text>
        </View>
        <View style={styles.headerCopy}>
        <Text style={styles.headerTitle}>{props.title}</Text>
          {props.subtitle ? <Text style={styles.headerSubtitle}>{props.subtitle}</Text> : null}
        </View>
      </View>
      <Pressable accessibilityRole="button" style={styles.languageButton} onPress={props.onSwitchLanguage}>
        <Text style={[styles.languageText, props.language === "en" ? styles.languageTextActive : undefined]}>EN</Text>
        <Text style={styles.languageDivider}>|</Text>
        <Text style={[styles.languageText, props.language === "hi" ? styles.languageTextActive : undefined]}>हिंदी</Text>
      </Pressable>
    </View>
  );
}

function AuthWelcome(props: {
  readonly persona: Persona;
  readonly tr: (key: CopyKey) => string;
}) {
  return (
    <View style={styles.authIntro}>
      <View style={styles.authMark}>
        <RoleGlyph variant={props.persona === "CONTRACTOR" ? "contractor" : "team"} active large />
      </View>
      <Text style={styles.authIntroTitle}>{props.tr("roleQuestion")}</Text>
      <Text style={styles.authIntroSubtitle}>{props.tr("appSubtitle")}</Text>
    </View>
  );
}

function PersonaSelector(props: {
  readonly persona: Persona;
  readonly setPersona: (persona: Persona) => void;
  readonly tr: (key: CopyKey) => string;
}) {
  return (
    <View style={styles.roleCards}>
      <RoleCard
        active={props.persona === "CONTRACTOR"}
        badge={props.tr("contractorAccess")}
        icon="contractor"
        title={props.tr("contractor")}
        body={props.tr("contractorRoleBody")}
        onPress={() => props.setPersona("CONTRACTOR")}
      />
      <RoleCard
        active={props.persona === "TEAM_MEMBER"}
        badge={props.tr("fastLogin")}
        icon="team"
        title={props.tr("teamMember")}
        body={props.tr("teamMemberRoleBody")}
        onPress={() => props.setPersona("TEAM_MEMBER")}
      />
    </View>
  );
}

function RoleCard(props: {
  readonly active: boolean;
  readonly badge: string;
  readonly body: string;
  readonly icon: "contractor" | "team";
  readonly onPress: () => void;
  readonly title: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.roleCard, props.active ? styles.roleCardActive : undefined, pressed ? styles.pressed : undefined]}
      onPress={props.onPress}
    >
      <View style={styles.roleIcon}>
        <RoleGlyph variant={props.icon} active={props.active} />
      </View>
      <View style={styles.roleCopy}>
        <Text numberOfLines={1} style={styles.roleTitle}>{props.title}</Text>
        <Text style={styles.roleBody}>{props.body}</Text>
        <View style={styles.roleBadge}>
          <Text numberOfLines={1} style={styles.roleBadgeText}>{props.badge}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function RoleGlyph(props: { readonly active?: boolean; readonly large?: boolean; readonly variant: "contractor" | "team" }) {
  const colorStyle = props.active ? styles.roleGlyphActive : styles.roleGlyph;
  const scaleStyle = props.large ? styles.roleGlyphLarge : undefined;

  if (props.variant === "team") {
    return (
      <View style={[styles.roleGlyphBox, scaleStyle]}>
        <View style={[styles.roleGlyphQrFrame, colorStyle]}>
          {[0, 1, 2, 3].map((cell) => (
            <View key={cell} style={[styles.roleGlyphQrCell, colorStyle]} />
          ))}
        </View>
        <View style={[styles.roleGlyphPersonHead, colorStyle]} />
      </View>
    );
  }

  return (
    <View style={[styles.roleGlyphBox, scaleStyle]}>
      <View style={[styles.roleGlyphPersonHead, colorStyle]} />
      <View style={[styles.roleGlyphPersonBody, colorStyle]} />
      <View style={[styles.roleGlyphBadge, props.active ? styles.roleGlyphBadgeActive : undefined]} />
    </View>
  );
}

function ContractorLogin(props: {
  readonly tr: (key: CopyKey) => string;
  readonly onAuthenticated: (contractor: PublicContractor, session: { readonly token: string; readonly expiresAt: string }) => Promise<void>;
  readonly runTask: (task: () => Promise<void>, showSuccess?: boolean) => Promise<void>;
}) {
  const [mobileNumber, setMobileNumber] = useState("");
  const [mpin, setMpin] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [newMpin, setNewMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [supportMessage, setSupportMessage] = useState("");

  async function submitLogin(): Promise<void> {
    await props.runTask(async () => {
      const response = await loginContractor(mobileNumber, mpin);
      if (response.status === "MPIN_SETUP_REQUIRED") {
        setSetupToken(response.session.token);
        return;
      }
      await props.onAuthenticated(response.contractor, response.session);
    });
  }

  async function submitSetMpin(): Promise<void> {
    await props.runTask(async () => {
      const response = await setContractorMpin(setupToken, newMpin, confirmMpin);
      await props.onAuthenticated(response.contractor, response.session);
    });
  }

  async function submitForgot(): Promise<void> {
    await props.runTask(async () => {
      const response = await forgotContractorMpin(mobileNumber);
      setSupportMessage(response.message || props.tr("supportMessage"));
    }, false);
  }

  return (
    <Panel title={setupToken ? props.tr("setMpin") : props.tr("welcomeBack")}>
      {!setupToken ? (
        <>
          <Text style={styles.panelLead}>{props.tr("loginHelper")}</Text>
          <Field label={props.tr("mobileNumber")} value={mobileNumber} onChangeText={setMobileNumber} keyboardType="phone-pad" />
          <PinField label={props.tr("mpin")} value={mpin} onChangeText={setMpin} revealLabel={props.tr("show")} hideLabel={props.tr("hide")} />
          <PrimaryButton label={props.tr("login")} onPress={submitLogin} />
          <Pressable accessibilityRole="button" onPress={submitForgot} style={styles.linkButton}>
            <Text style={styles.linkText}>{props.tr("forgotMpin")}</Text>
          </Pressable>
          {supportMessage ? <Text style={styles.helperText}>{supportMessage}</Text> : null}
          <TrustPanel title={props.tr("secureAccess")} body={props.tr("secureAccessBody")} />
        </>
      ) : (
        <>
          <Text style={styles.helperText}>{props.tr("setupRequired")}</Text>
          <PinField label={props.tr("newMpin")} value={newMpin} onChangeText={setNewMpin} revealLabel={props.tr("show")} hideLabel={props.tr("hide")} />
          <PinField label={props.tr("confirmMpin")} value={confirmMpin} onChangeText={setConfirmMpin} revealLabel={props.tr("show")} hideLabel={props.tr("hide")} />
          <PrimaryButton label={props.tr("saveMpin")} onPress={submitSetMpin} />
        </>
      )}
    </Panel>
  );
}

function TeamMemberLogin(props: {
  readonly tr: (key: CopyKey) => string;
  readonly recentContractor: StoredRecentContractor | null;
  readonly setRecentContractorState: (recent: StoredRecentContractor | null) => void;
  readonly onAuthenticated: (contractor: PublicContractor, session: { readonly token: string; readonly expiresAt: string; readonly actor: { readonly teamMemberMobile?: string } }) => Promise<void>;
  readonly runTask: (task: () => Promise<void>, showSuccess?: boolean) => Promise<void>;
}) {
  const [contractorMobileNumber, setContractorMobileNumber] = useState("");
  const [teamMemberMobile, setTeamMemberMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [challenge, setChallenge] = useState<TeamMemberOtpResponse | null>(null);
  const devFeatures = useMemo(() => getRuntimeMobileDevFeatures(), []);

  async function requestOtp(): Promise<void> {
    await props.runTask(async () => {
      const response = await requestTeamMemberOtp({ contractorMobileNumber, teamMemberMobile });
      setChallenge(response);
      if (response.status === "NOT_REGISTERED") {
        throw new Error(props.tr("notRegistered"));
      }
    });
  }

  async function verifyOtp(): Promise<void> {
    if (!challenge?.challengeId) {
      return;
    }
    await props.runTask(async () => {
      const response = await verifyTeamMemberOtp({
        challengeId: challenge.challengeId as string,
        otp,
        teamMemberMobile,
      });
      await props.onAuthenticated(response.contractor, response.session);
    });
  }

  async function clearRecent(): Promise<void> {
    await clearRecentContractor();
    props.setRecentContractorState(null);
  }

  return (
    <Panel title={props.tr("contractorMobile")}>
      <Text style={styles.panelLead}>{props.tr("contractorAssistPrompt")}</Text>
      {props.recentContractor ? (
        <View style={styles.recentCard}>
          <View style={styles.identityRow}>
            <ContractorAvatar name={props.recentContractor.name} photoUrl={props.recentContractor.photoUrl} />
            <View style={styles.identityCopy}>
              <Text style={styles.overline}>{props.tr("recentContractor")}</Text>
              <Text style={styles.cardTitle}>{props.recentContractor.name}</Text>
              <Text style={styles.mutedText}>{props.recentContractor.mobileNumber}</Text>
            </View>
          </View>
          <View style={styles.recentActions}>
            <SecondaryButton
              label={props.tr("useRecent")}
              onPress={() => setContractorMobileNumber(props.recentContractor?.mobileNumber ?? "")}
            />
            <Pressable accessibilityRole="button" onPress={clearRecent} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>{props.tr("clear")}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      <Field
        label={props.tr("contractorMobile")}
        value={contractorMobileNumber}
        onChangeText={setContractorMobileNumber}
        keyboardType="phone-pad"
      />
      <Field label={props.tr("teamMemberMobile")} value={teamMemberMobile} onChangeText={setTeamMemberMobile} keyboardType="phone-pad" />
      <Text style={styles.helperText}>{props.tr("teamOtpEverySession")}</Text>
      <PrimaryButton label={props.tr("sendOtpToContractor")} onPress={requestOtp} />
      {challenge?.delivery?.mockOtp && devFeatures.showMockOtp ? (
        <View style={styles.devOtp}>
          <Text style={styles.devOtpText}>
            {props.tr("mockOtp")}: {challenge.delivery.mockOtp}
          </Text>
        </View>
      ) : null}
      {challenge?.challengeId ? (
        <>
          <Field label={props.tr("otp")} value={otp} onChangeText={setOtp} keyboardType="number-pad" />
          <PrimaryButton label={props.tr("verifyOtp")} onPress={verifyOtp} />
        </>
      ) : null}
    </Panel>
  );
}

function SessionSummary(props: {
  readonly session: StoredSession;
  readonly tr: (key: CopyKey) => string;
  readonly onLogout: () => void;
  readonly onProfile?: () => void;
}) {
  return (
    <View style={styles.summary}>
      <View style={styles.summaryTop}>
        <Pressable accessibilityLabel={props.tr("profile")} accessibilityRole="button" style={styles.identityRow} onPress={props.onProfile}>
          <ContractorAvatar name={props.session.contractor.name} photoUrl={props.session.contractor.photoUrl} />
          <View style={styles.identityCopy}>
            <Text style={styles.overline}>{props.session.role === "TEAM_MEMBER" ? props.tr("teamMember") : props.tr("contractor")}</Text>
            <Text style={styles.summaryName}>{props.session.contractor.name}</Text>
            <Text style={styles.summaryMobile}>{props.session.contractor.mobileNumber}</Text>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={props.onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>{props.tr("logout")}</Text>
        </Pressable>
      </View>
      <View style={styles.metricRow}>
        <Metric label={props.tr("balance")} value={String(props.session.contractor.availablePoints)} emphasis />
        <Metric label={props.tr("totalEarned")} value={String(props.session.contractor.totalAccumulatedPoints)} />
        <Metric label={props.tr("tier")} value={props.session.contractor.tier ?? "Bronze"} />
      </View>
    </View>
  );
}

function DashboardView(props: {
  readonly session: StoredSession;
  readonly tr: (key: CopyKey) => string;
  readonly sites: readonly SiteSummary[];
  readonly selectedSiteId: string;
  readonly history: readonly ScanHistoryEntry[];
  readonly catalog: RewardCatalogResponse | null;
  readonly promotion: PromotionBanner | undefined;
  readonly onBalanceBook: () => void;
  readonly onScan: () => void;
  readonly onSites: () => void;
  readonly onHistory: () => void;
  readonly onRewards: () => void;
  readonly onProfile: () => void;
}) {
  const selectedSite = props.sites.find((site) => site.siteId === props.selectedSiteId);
  const recentScan = props.history[0];
  const featuredRewards = selectFeaturedRewards(props.catalog?.items ?? []);
  const totalEarned = props.session.contractor.totalAccumulatedPoints;
  const nextMilestone = Math.max(30000, Math.ceil((totalEarned + 1) / 10000) * 10000);
  const milestoneProgress = Math.min(1, totalEarned / nextMilestone);

  return (
    <>
      <View style={styles.homeGreeting}>
        <View style={styles.greetingCopy}>
          <Text numberOfLines={1} style={styles.greetingTitle}>
            {props.tr("namaste")}, {props.session.contractor.name.split(" ")[0] ?? props.session.contractor.name}!
          </Text>
          <View style={styles.tierPill}>
            <Text numberOfLines={1} style={styles.tierPillText}>{props.session.contractor.tier ?? "Silver"} {props.tr("member")}</Text>
          </View>
        </View>
        <Pressable accessibilityLabel={props.tr("profile")} accessibilityRole="button" onPress={props.onProfile}>
          <ContractorAvatar name={props.session.contractor.name} photoUrl={props.session.contractor.photoUrl} />
        </Pressable>
      </View>

      <PromotionBannerCard promotion={props.promotion} />

      <View style={styles.dashboardMetricGrid}>
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.pointsCard, pressed ? styles.pressed : undefined]} onPress={props.onBalanceBook}>
          <Text numberOfLines={1} style={styles.metricCardLabel}>{props.tr("pointsAvailable")}</Text>
          <Text style={styles.pointsValue}>{props.session.contractor.availablePoints.toLocaleString("en-IN")}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.pointsCard, pressed ? styles.pressed : undefined]} onPress={props.onRewards}>
          <Text numberOfLines={1} style={styles.metricCardLabel}>{props.tr("lifetimeCollected")}</Text>
          <Text style={styles.metricCardValue}>{totalEarned.toLocaleString("en-IN")}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${milestoneProgress * 100}%` }]} />
          </View>
          <Text numberOfLines={1} style={styles.rewardGap}>{props.tr("nextMilestone")}: {nextMilestone.toLocaleString("en-IN")}</Text>
        </Pressable>
      </View>

      <Pressable accessibilityRole="button" style={({ pressed }) => [styles.selectedSiteStrip, pressed ? styles.pressed : undefined]} onPress={props.onSites}>
        <Text style={styles.overline}>{props.tr("selectedSiteManage")}</Text>
        <Text numberOfLines={2} style={styles.selectedSiteTitle}>{selectedSite ? siteLabel(selectedSite) : props.tr("noSite")}</Text>
        <Text numberOfLines={2} style={styles.mutedText}>{props.tr("dashboardPrompt")}</Text>
      </Pressable>

      <Pressable accessibilityRole="button" style={({ pressed }) => [styles.scanHeroCard, pressed ? styles.pressed : undefined]} onPress={props.onScan}>
        <View style={styles.scanHeroIcon}>
          <TabGlyph routeName="Scan" focused />
        </View>
        <View style={styles.scanHeroCopy}>
          <Text numberOfLines={1} style={styles.scanHeroTitle}>{props.tr("scanQr")}</Text>
          <Text numberOfLines={2} style={styles.scanHeroSubtitle}>
            {selectedSite ? `${props.tr("selectedSite")}: ${siteLabel(selectedSite)}` : props.tr("dashboardPrompt")}
          </Text>
        </View>
      </Pressable>

      <View style={styles.shortcutGrid}>
        <QuickAction icon="ledger" title={props.tr("balanceBook")} caption={props.tr("viewLedger")} onPress={props.onBalanceBook} />
        <QuickAction icon="history" title={props.tr("scanHistory")} caption={props.tr("recentScans")} onPress={props.onHistory} />
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{props.tr("featuredRewards")}</Text>
        <Pressable accessibilityRole="button" onPress={props.onRewards}>
          <Text style={styles.inlineLink}>{props.tr("seeAll")} ›</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRewardRail}>
        {featuredRewards.map((reward) => (
          <RewardTile key={reward.rewardId} reward={reward} selected={false} tr={props.tr} onPress={props.onRewards} compact />
        ))}
      </ScrollView>

      <Panel title={props.tr("recentActivity")}>
        <DashboardRow
          label={props.tr("scanHistory")}
          onPress={props.onHistory}
          value={recentScan ? dashboardRecentScanValue(recentScan, props.tr) : props.tr("emptyHistory")}
        />
      </Panel>
    </>
  );
}

function ProfileView(props: {
  readonly tr: (key: CopyKey) => string;
  readonly session: StoredSession;
  readonly onLogout: () => void;
  readonly onSessionChanged: (session: StoredSession) => Promise<void>;
}) {
  const [oldMpin, setOldMpin] = useState("");
  const [newMpin, setNewMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [message, setMessage] = useState("");
  const [photoDraft, setPhotoDraft] = useState(props.session.contractor.photoUrl ?? "");
  const [photoBusy, setPhotoBusy] = useState(false);

  useEffect(() => {
    setPhotoDraft(props.session.contractor.photoUrl ?? "");
  }, [props.session.contractor.photoUrl]);

  async function submitChangeMpin(): Promise<void> {
    const response = await changeContractorMpin(props.session.token, oldMpin, newMpin, confirmMpin);
    await props.onSessionChanged(toStoredSession("CONTRACTOR", response.contractor, response.session.token, response.session.expiresAt));
    setMessage(props.tr("success"));
    setOldMpin("");
    setNewMpin("");
    setConfirmMpin("");
  }

  async function saveProfilePhoto(): Promise<void> {
    setPhotoBusy(true);
    setMessage("");
    try {
      const response = await updateContractorProfilePhoto(props.session.token, photoDraft || null);
      await props.onSessionChanged(toStoredSession("CONTRACTOR", response.contractor, props.session.token, props.session.expiresAt));
      setPhotoDraft(response.contractor.photoUrl ?? "");
      setMessage(props.tr("profilePhotoSaved"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : props.tr("error"));
    } finally {
      setPhotoBusy(false);
    }
  }

  async function removeProfilePhoto(): Promise<void> {
    setPhotoDraft("");
    setPhotoBusy(true);
    setMessage("");
    try {
      const response = await updateContractorProfilePhoto(props.session.token, null);
      await props.onSessionChanged(toStoredSession("CONTRACTOR", response.contractor, props.session.token, props.session.expiresAt));
      setMessage(props.tr("profilePhotoRemoved"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : props.tr("error"));
    } finally {
      setPhotoBusy(false);
    }
  }

  return (
    <>
      <Panel title={props.tr("profile")}>
        <View style={styles.profileHeader}>
          <ContractorAvatar large name={props.session.contractor.name} photoUrl={photoDraft || props.session.contractor.photoUrl} />
          <View style={styles.identityCopy}>
            <Text style={styles.cardTitle}>{props.session.contractor.name}</Text>
            <Text style={styles.mutedText}>{props.session.contractor.mobileNumber}</Text>
            <Text style={styles.mutedText}>{props.session.contractor.tier ?? "Silver"}</Text>
          </View>
        </View>
        <ProfilePhotoControls
          currentPhotoUrl={props.session.contractor.photoUrl ?? ""}
          disabled={photoBusy}
          draftPhotoUrl={photoDraft}
          onChange={setPhotoDraft}
          onRemove={() => void removeProfilePhoto()}
          onSave={() => void saveProfilePhoto()}
          tr={props.tr}
        />
        <View style={styles.rowActions}>
          <SecondaryButton label={props.tr("helpSupport")} onPress={() => setMessage(props.tr("supportMessage"))} />
          <SecondaryButton label={props.tr("about")} onPress={() => setMessage(props.tr("storeReadyNote"))} />
        </View>
        {message ? <Text style={styles.helperText}>{message}</Text> : null}
      </Panel>
      <Panel title={props.tr("changeMpin")}>
        <Field label={props.tr("oldMpin")} value={oldMpin} onChangeText={setOldMpin} keyboardType="number-pad" secureTextEntry revealLabel={props.tr("show")} hideLabel={props.tr("hide")} />
        <Field label={props.tr("newMpin")} value={newMpin} onChangeText={setNewMpin} keyboardType="number-pad" secureTextEntry revealLabel={props.tr("show")} hideLabel={props.tr("hide")} />
        <Field label={props.tr("confirmMpin")} value={confirmMpin} onChangeText={setConfirmMpin} keyboardType="number-pad" secureTextEntry revealLabel={props.tr("show")} hideLabel={props.tr("hide")} />
        <PrimaryButton label={props.tr("saveMpin")} onPress={submitChangeMpin} />
      </Panel>
      <Pressable accessibilityRole="button" onPress={props.onLogout} style={styles.fullWidthLogout}>
        <Text style={styles.logoutText}>{props.tr("logout")}</Text>
      </Pressable>
    </>
  );
}

function ProfilePhotoControls(props: {
  readonly currentPhotoUrl: string;
  readonly disabled: boolean;
  readonly draftPhotoUrl: string;
  readonly onChange: (photoUrl: string) => void;
  readonly onRemove: () => void;
  readonly onSave: () => void;
  readonly tr: (key: CopyKey) => string;
}) {
  const [fileMessage, setFileMessage] = useState("");
  const hasPhoto = Boolean(props.draftPhotoUrl || props.currentPhotoUrl);
  const hasUnsavedChange = props.draftPhotoUrl !== props.currentPhotoUrl;

  async function handleWebFileChange(event: unknown): Promise<void> {
    const target = (event as { target?: { files?: ArrayLike<unknown> | null; value?: string } }).target;
    const file = target?.files?.[0];
    if (!file) {
      return;
    }
    const fileLike = file as { readonly size?: number; readonly type?: string };
    if (!["image/jpeg", "image/png"].includes(fileLike.type ?? "")) {
      setFileMessage(props.tr("profilePhotoTypeError"));
      return;
    }
    if ((fileLike.size ?? 0) > 2_000_000) {
      setFileMessage(props.tr("profilePhotoSizeError"));
      return;
    }
    try {
      props.onChange(await readFileAsDataUrl(file));
      setFileMessage(props.tr("profilePhotoReady"));
    } catch {
      setFileMessage(props.tr("profilePhotoReadError"));
    } finally {
      if (target) {
        target.value = "";
      }
    }
  }

  return (
    <View style={styles.profilePhotoPanel}>
      <View style={styles.profilePhotoHeader}>
        <View>
          <Text style={styles.overline}>{props.tr("profilePhoto")}</Text>
          <Text style={styles.mutedText}>{props.tr("profilePhotoHint")}</Text>
        </View>
        {hasPhoto ? <StatusBadge label={props.tr("active")} tone="success" /> : <StatusBadge label={props.tr("notSelected")} tone="muted" />}
      </View>
      {Platform.OS === "web" ? (
        createElement("input", {
          accept: "image/png,image/jpeg",
          "aria-label": props.tr("chooseProfilePhoto"),
          disabled: props.disabled,
          onChange: (event: unknown) => {
            void handleWebFileChange(event);
          },
          style: webFileInputStyle,
          type: "file",
        })
      ) : (
        <Text style={styles.helperText}>{props.tr("nativeProfilePhotoPending")}</Text>
      )}
      {fileMessage ? <Text style={styles.helperText}>{fileMessage}</Text> : null}
      <View style={styles.rowActions}>
        <PrimaryButton
          disabled={props.disabled || !hasUnsavedChange}
          label={props.tr("savePhoto")}
          onPress={props.onSave}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: props.disabled || !hasPhoto }}
          disabled={props.disabled || !hasPhoto}
          onPress={props.onRemove}
          style={({ pressed }) => [
            styles.secondaryButton,
            props.disabled || !hasPhoto ? styles.disabledSecondaryButton : undefined,
            pressed ? styles.pressed : undefined,
          ]}
        >
          <Text style={styles.secondaryButtonText}>{props.tr("removePhoto")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DashboardRow(props: { readonly label: string; readonly onPress?: () => void; readonly value: string }) {
  const content = (
    <>
      <Text style={styles.overline}>{props.label}</Text>
      <Text style={styles.cardTitle}>{props.value}</Text>
    </>
  );

  if (props.onPress) {
    return (
      <Pressable accessibilityRole="button" style={({ pressed }) => [styles.dashboardRow, pressed ? styles.pressed : undefined]} onPress={props.onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.dashboardRow}>{content}</View>;
}

function TeamMemberLanding(props: {
  readonly session: StoredSession;
  readonly tr: (key: CopyKey) => string;
  readonly activeSite: SiteSummary | undefined;
  readonly promotion: PromotionBanner | undefined;
  readonly onLogout: () => void;
}) {
  return (
    <View style={styles.teamLanding}>
      <View style={styles.summaryTop}>
        <View style={styles.identityRow}>
          <ContractorAvatar name={props.session.contractor.name} photoUrl={props.session.contractor.photoUrl} />
          <View style={styles.identityCopy}>
            <Text style={styles.overline}>{props.tr("teamContractorContext")}</Text>
            <Text style={styles.summaryName}>{props.session.contractor.name}</Text>
            <Text style={styles.summaryMobile}>{props.session.contractor.mobileNumber}</Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" onPress={props.onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>{props.tr("logout")}</Text>
        </Pressable>
      </View>
      <View style={styles.teamSiteBox}>
        <Text style={styles.overline}>{props.tr("selectedSiteManage")}</Text>
        <Text style={styles.cardTitle}>{props.activeSite ? siteLabel(props.activeSite) : props.tr("noSite")}</Text>
        <Text style={styles.mutedText}>{props.tr("teamSessionNote")}</Text>
      </View>
      <PromotionBannerCard promotion={props.promotion} compact />
    </View>
  );
}

function PromotionBannerCard({
  compact = false,
  promotion,
}: {
  readonly compact?: boolean;
  readonly promotion: PromotionBanner | undefined;
}) {
  if (!promotion) {
    return null;
  }
  const title = promotion.overlayText || promotion.title;
  const fontWeight = promotion.overlayFontStyle === "regular" || promotion.overlayFontStyle === "italic" ? "700" : "900";
  const fontStyle = promotion.overlayFontStyle === "italic" || promotion.overlayFontStyle === "boldItalic" ? "italic" : "normal";
  return (
    <View style={[styles.promoBanner, compact ? styles.promoBannerCompact : undefined]}>
      <View style={styles.promoCopyBlock}>
        <Text
          numberOfLines={promotion.marqueeEnabled || compact ? 1 : 2}
          style={[
            styles.promoTitle,
            {
              color: promotion.overlayTextColor,
              fontSize: Math.min(compact ? 20 : 24, Math.max(16, promotion.overlayFontSize)),
              fontStyle,
              fontWeight,
            },
          ]}
        >
          {title}
        </Text>
        <Text numberOfLines={compact ? 2 : 3} style={styles.promoBody}>{promotion.body}</Text>
      </View>
      {promotion.assetUrl ? (
        <Image
          accessibilityIgnoresInvertColors
          source={{ uri: promotion.assetUrl }}
          style={[styles.promoImage, compact ? styles.promoImageCompact : undefined]}
        />
      ) : null}
    </View>
  );
}

function ScanView(props: {
  readonly tr: (key: CopyKey) => string;
  readonly session: StoredSession;
  readonly sites: readonly SiteSummary[];
  readonly selectedSiteId: string;
  readonly setSelectedSiteId: (siteId: string) => void;
  readonly activeSite: SiteSummary | undefined;
  readonly runTask: (task: () => Promise<void>, showSuccess?: boolean) => Promise<void>;
  readonly refreshSitesAndHistory: () => Promise<void>;
  readonly updateBalanceFromCartCommit: (result: CommitScanCartResult) => Promise<void>;
  readonly onCartStateChange?: (reservedItemCount: number) => void;
  readonly cartGuardVisible?: boolean;
  readonly onDismissCartGuard?: () => void;
  readonly onScanFailure: (failure: ScanFailureViewModel) => void;
  readonly onScanSuccess: (success: ScanSuccessViewModel) => void;
}) {
  const [qrToken, setQrToken] = useState("");
  const [scanCart, setScanCart] = useState<ScanCartSummary | undefined>();
  const [commitNotice, setCommitNotice] = useState<CartCommitNotice | undefined>();
  const devFeatures = useMemo(() => getRuntimeMobileDevFeatures(), []);
  const canScan = Boolean(props.activeSite);
  const activeSiteCount = props.sites.filter((site) => site.status === "ACTIVE").length;
  const isTeamMemberWithoutSites = props.session.role === "TEAM_MEMBER" && activeSiteCount === 0;

  function syncScanCart(nextCart: ScanCartSummary | undefined): void {
    setScanCart(nextCart);
    props.onCartStateChange?.(reservedScanCartItemCount(nextCart?.items));
  }

  useEffect(() => {
    let cancelled = false;
    async function loadCart(): Promise<void> {
      if (!props.activeSite) {
        syncScanCart(undefined);
        return;
      }
      try {
        const cart = await getScanCart(props.session.token, { siteId: props.activeSite.siteId });
        if (!cancelled) {
          syncScanCart(cart);
        }
      } catch {
        if (!cancelled) {
          syncScanCart(undefined);
        }
      }
    }
    void loadCart();
    return () => {
      cancelled = true;
    };
  }, [props.activeSite?.siteId, props.session.token]);

  async function submitScan(): Promise<void> {
    await props.runTask(async () => {
      try {
        if (!props.activeSite) {
          throw new Error(props.tr("noSite"));
        }
        const trimmedToken = qrToken.trim();
        if (!trimmedToken) {
          throw new Error(props.tr("invalidQrBody"));
        }
        setCommitNotice(undefined);
        const result = await scanQr({
          token: trimmedToken,
          siteId: props.activeSite.siteId,
          sessionToken: props.session.token,
          ...(props.session.role === "TEAM_MEMBER" ? { teamMemberSessionId: teamMemberSessionId(props.session) } : {}),
        });
        syncScanCart(result.cart);
        setQrToken("");
        await props.refreshSitesAndHistory();
        props.onScanSuccess({
          actorLabel: props.session.role === "TEAM_MEMBER" ? props.tr("teamMember") : props.tr("contractor"),
          result,
          showPoints: shouldShowScanPoints(props.session.role),
          siteLabel: siteLabel(props.activeSite),
        });
      } catch (error) {
        props.onScanFailure({
          ...scanFailureFromError(error, props.tr),
          siteLabel: props.activeSite ? siteLabel(props.activeSite) : props.tr("noSite"),
        });
      }
    }, false);
  }

  async function submitCartCommit(): Promise<void> {
    await props.runTask(async () => {
      if (!props.activeSite) {
        throw new Error(props.tr("noSite"));
      }
      const activeSite = props.activeSite;
      const committedSiteLabel = siteLabel(activeSite);
      const commitInput = {
        token: props.session.token,
        siteId: activeSite.siteId,
        ...(props.session.role === "TEAM_MEMBER" ? { teamMemberSessionId: teamMemberSessionId(props.session) } : {}),
      };
      const result = await commitScanCart(commitInput).catch(async (error: unknown) => {
        const currentCart = await getScanCart(props.session.token, { siteId: props.activeSite?.siteId ?? commitInput.siteId }).catch(() => undefined);
        syncScanCart(currentCart);
        throw error;
      });
      await props.updateBalanceFromCartCommit(result);
      syncScanCart(result.cart);
      props.setSelectedSiteId("");
      props.onDismissCartGuard?.();
      setCommitNotice({
        balanceAfter: result.balanceAfter,
        pointsCredited: result.pointsCredited,
        siteLabel: committedSiteLabel,
      });
      await props.refreshSitesAndHistory();
    });
  }

  return (
    <>
    <Panel title={props.tr("scanQr")}>
      {props.cartGuardVisible && hasReservedScanCartItems(scanCart?.items) ? (
        <CartNavigationGuard tr={props.tr} onAddToAccount={submitCartCommit} onStay={() => props.onDismissCartGuard?.()} />
      ) : null}
      {commitNotice ? <CartCommitSuccess notice={commitNotice} tr={props.tr} /> : null}
      {isTeamMemberWithoutSites ? <TeamMemberNoSiteNotice contractorName={props.session.contractor.name} tr={props.tr} /> : null}
      <SiteChooser sites={props.sites} selectedSiteId={props.selectedSiteId} setSelectedSiteId={props.setSelectedSiteId} tr={props.tr} />
      <View style={styles.scanningForCard}>
        <View style={styles.identityRow}>
          <ContractorAvatar name={props.session.contractor.name} photoUrl={props.session.contractor.photoUrl} />
          <View style={styles.identityCopy}>
            <Text style={styles.scanIdentityLabel}>{props.tr("scanningFor")}</Text>
            <Text style={styles.scanIdentityName}>{props.session.contractor.name}</Text>
            <Text style={styles.scanIdentityMeta}>{props.activeSite ? siteLabel(props.activeSite) : props.tr("noSite")}</Text>
          </View>
        </View>
      </View>
      {canScan ? (
        <View style={styles.scanTargetCard}>
          <View style={styles.scanTargetInner}>
            <View style={styles.scanTargetIcon}>
              <TabGlyph routeName="Scan" focused />
            </View>
            <Text style={styles.scanTargetTitle}>{props.tr("scanProductQr")}</Text>
            <Text style={styles.mutedText}>{props.tr("placeCode")}</Text>
          </View>
        </View>
      ) : null}
      {devFeatures.allowManualQrEntry ? (
        <>
          {canScan ? (
            <>
              <Field label={props.tr("qrToken")} value={qrToken} onChangeText={setQrToken} autoCapitalize="none" />
              <PrimaryButton label={props.tr("submitScan")} onPress={submitScan} disabled={!qrToken.trim()} />
            </>
          ) : (
            <View style={styles.cameraOnlyNotice}>
              <Text style={styles.cameraOnlyText}>{isTeamMemberWithoutSites ? props.tr("teamMemberNoSitesShort") : props.tr("selectSiteBeforeScan")}</Text>
            </View>
          )}
          <ScanCartCard
            cart={scanCart}
            showPoints={shouldShowScanPoints(props.session.role)}
            tr={props.tr}
            onCommit={submitCartCommit}
          />
        </>
      ) : canScan ? (
        <View style={styles.cameraOnlyNotice}>
          <Text style={styles.cameraOnlyText}>{props.tr("cameraScanOnly")}</Text>
        </View>
      ) : (
        <View style={styles.cameraOnlyNotice}>
          <Text style={styles.cameraOnlyText}>{isTeamMemberWithoutSites ? props.tr("teamMemberNoSitesShort") : props.tr("selectSiteBeforeScan")}</Text>
        </View>
      )}
    </Panel>
    </>
  );
}

function ScanCartCard(props: {
  readonly cart: ScanCartSummary | undefined;
  readonly onCommit: () => Promise<void>;
  readonly showPoints: boolean;
  readonly tr: (key: CopyKey) => string;
}) {
  const [copyNotice, setCopyNotice] = useState("");
  const reservedItems = getReservedScanCartItems(props.cart?.items);

  if (!props.cart || reservedItems.length === 0) {
    return null;
  }

  async function copyCartValue(label: string, value: string): Promise<void> {
    const copied = await copyTextToClipboard(value);
    setCopyNotice(copied ? `${props.tr("copied")}: ${label}` : props.tr("copyUnavailable"));
  }

  return (
    <View style={styles.scanCartCard}>
      <View style={styles.scanCartHeader}>
        <View>
          <Text style={styles.overline}>{props.tr("scanCart")}</Text>
          <Text style={styles.cardTitle}>{props.tr("readyToAdd")}</Text>
          <Text style={styles.mutedText}>{props.tr("reservedCartHint")}</Text>
        </View>
        <StatusBadge label={props.tr("reservedInCart")} tone="warning" />
      </View>
      <View style={styles.scanCartMetricRow}>
        <Metric label={props.tr("scans")} value={String(reservedItems.length)} />
        {props.showPoints ? <Metric label={props.tr("pointsInCart")} value={totalReservedScanCartPoints(reservedItems).toLocaleString("en-IN")} emphasis /> : null}
      </View>
      <PrimaryButton label={props.tr("addToAccount")} onPress={props.onCommit} />
      {copyNotice ? <Text style={styles.successNotice}>{copyNotice}</Text> : null}
      {reservedItems.map((item) => (
        <View key={item.cartItemId} style={styles.scanCartItemCard}>
          <View style={styles.scanCartItemTop}>
            <View style={styles.scanCartItemCopy}>
              <Text numberOfLines={1} style={styles.cardTitle}>{item.productSku ?? props.tr("itemReference")}</Text>
              <Text style={styles.mutedText}>{props.tr("reservedAt")}: {formatDateTime(item.reservedAt)}</Text>
            </View>
            <StatusBadge label={props.tr("readyToAdd")} tone="warning" />
          </View>
          <View style={styles.scanCartMetricRow}>
            {props.showPoints ? <Metric label={props.tr("qrValue")} value={`+${item.qrValuePoints}`} emphasis /> : null}
            <Metric label={props.tr("creditedPoints")} value={props.showPoints ? "0" : "-"} />
          </View>
          <CopyValue
            label={props.tr("qrUnit")}
            onCopy={() => void copyCartValue(props.tr("qrUnit"), item.qrUnitId)}
            tr={props.tr}
            value={item.qrUnitId}
          />
          <CopyValue
            label={props.tr("attemptId")}
            onCopy={() => void copyCartValue(props.tr("attemptId"), item.scanAttemptId)}
            tr={props.tr}
            value={item.scanAttemptId}
          />
        </View>
      ))}
      <Text style={styles.helperText}>{props.tr("cartRetryHint")}</Text>
      <PrimaryButton label={props.tr("addToAccount")} onPress={props.onCommit} />
    </View>
  );
}

function CartNavigationGuard(props: {
  readonly onAddToAccount: () => Promise<void>;
  readonly onStay: () => void;
  readonly tr: (key: CopyKey) => string;
}) {
  return (
    <View style={styles.cartGuardCard}>
      <Text style={styles.cardTitle}>{props.tr("cartGuardTitle")}</Text>
      <Text style={styles.mutedText}>{props.tr("cartGuardBody")}</Text>
      <View style={styles.rowActions}>
        <PrimaryButton label={props.tr("addToAccount")} onPress={props.onAddToAccount} />
        <SecondaryButton label={props.tr("stayOnScan")} onPress={props.onStay} />
      </View>
    </View>
  );
}

function CartCommitSuccess(props: {
  readonly notice: CartCommitNotice;
  readonly tr: (key: CopyKey) => string;
}) {
  return (
    <View style={styles.cartCommitSuccessCard}>
      <Text style={styles.cardTitle}>{props.tr("pointsAddedToAccount")}</Text>
      <Text style={styles.mutedText}>
        {props.notice.pointsCredited.toLocaleString("en-IN")} {props.tr("points")} · {props.notice.siteLabel}
      </Text>
      <Text style={styles.helperText}>
        {props.tr("currentBalance")}: {props.notice.balanceAfter.toLocaleString("en-IN")} {props.tr("points")}
      </Text>
    </View>
  );
}

function TeamMemberNoSiteNotice(props: {
  readonly contractorName: string;
  readonly tr: (key: CopyKey) => string;
}) {
  return (
    <View style={styles.teamNoSiteCard}>
      <Text style={styles.cardTitle}>{props.tr("teamMemberNoSitesTitle")}</Text>
      <Text style={styles.mutedText}>
        {props.tr("teamMemberNoSitesBody").replace("{contractor}", props.contractorName)}
      </Text>
    </View>
  );
}

function CopyValue(props: {
  readonly label: string;
  readonly onCopy: () => void;
  readonly tr: (key: CopyKey) => string;
  readonly value: string;
}) {
  return (
    <View style={styles.copyValueRow}>
      <View style={styles.copyValueText}>
        <Text style={styles.overline}>{props.label}</Text>
        <Text selectable style={styles.copyValue}>{props.value}</Text>
      </View>
      <SecondaryButton label={props.tr("copy")} onPress={props.onCopy} />
    </View>
  );
}

function ScanResultPanel(props: {
  readonly onScanAnother: () => void;
  readonly result: ScanSuccessViewModel | undefined;
  readonly tr: (key: CopyKey) => string;
}) {
  if (!props.result) {
    return (
      <View style={styles.scanResultPanel}>
        <Text style={styles.resultTitle}>{props.tr("scanFailed")}</Text>
        <PrimaryButton label={props.tr("scanAnother")} onPress={props.onScanAnother} />
      </View>
    );
  }

  const { result } = props.result;
  return (
    <View style={styles.scanResultPanel}>
      <View style={styles.resultIconSuccess}>
        <Text style={styles.resultIconText}>✓</Text>
      </View>
      <Text style={styles.resultTitle}>{props.tr("readyToAdd")}</Text>
      <Text style={styles.resultSubtitle}>
        {props.tr("transactionReference")}: {result.qrId}
      </Text>
      <View style={styles.resultProductCard}>
        <View style={styles.productThumb}>
          <TabGlyph routeName="Scan" focused />
        </View>
        <View style={styles.resultProductCopy}>
          <Text style={styles.cardTitle}>{result.qrId}</Text>
          <Text style={styles.mutedText}>{props.result.siteLabel}</Text>
          <Text style={styles.mutedText}>{props.result.actorLabel}</Text>
          <Text style={styles.mutedText}>{result.reservedAt ? new Date(result.reservedAt).toLocaleString() : ""}</Text>
        </View>
        {props.result.showPoints ? (
          <View style={styles.pointsDeltaBox}>
            <Text style={styles.pointsDeltaText}>+{result.qrValuePoints}</Text>
            <Text style={styles.mutedText}>{props.tr("qrValue")}</Text>
          </View>
        ) : null}
      </View>
      {props.result.showPoints ? (
        <View style={styles.balanceResultCard}>
          <Text style={styles.overline}>{props.tr("pointsInCart")}</Text>
          <Text style={styles.balanceResultValue}>
            {result.cart.cartTotalPoints.toLocaleString("en-IN")} {props.tr("points")}
          </Text>
        </View>
      ) : (
        <View style={styles.balanceResultCard}>
          <Text style={styles.overline}>{props.tr("teamMember")}</Text>
          <Text style={styles.balanceResultValue}>{props.tr("reservedInCart")}</Text>
        </View>
      )}
      <PrimaryButton label={props.tr("scanAnother")} onPress={props.onScanAnother} />
    </View>
  );
}

function ScanFailurePanel(props: {
  readonly failure: ScanFailureViewModel | undefined;
  readonly onScanAnother: () => void;
  readonly tr: (key: CopyKey) => string;
}) {
  const failure = props.failure ?? {
    body: props.tr("error"),
    title: props.tr("scanFailed"),
    tone: "danger" as const,
  };

  return (
    <View style={styles.scanResultPanel}>
      <View style={failure.tone === "warning" ? styles.resultIconWarning : styles.resultIconDanger}>
        <Text style={failure.tone === "warning" ? styles.resultIconWarningText : styles.resultIconDangerText}>!</Text>
      </View>
      <Text style={styles.resultTitle}>{failure.title}</Text>
      {failure.siteLabel ? <Text style={styles.resultSubtitle}>{failure.siteLabel}</Text> : null}
      <Text style={styles.resultFailureBody}>{failure.body}</Text>
      <PrimaryButton label={props.tr("scanAnother")} onPress={props.onScanAnother} />
    </View>
  );
}

function SitesView(props: {
  readonly tr: (key: CopyKey) => string;
  readonly session: StoredSession;
  readonly sites: readonly SiteSummary[];
  readonly selectedSiteId: string;
  readonly setSelectedSiteId: (siteId: string) => void;
  readonly onAddSite: () => void;
  readonly onSelectSite: (siteId: string) => void;
  readonly onOpenSite: (siteId: string) => void;
}) {
  const isTeamMember = props.session.role === "TEAM_MEMBER";

  return (
    <Panel title={props.tr("yourSites")}>
      <Text style={styles.helperText}>{isTeamMember ? props.tr("teamSiteSelectHint") : props.tr("siteManageHint")}</Text>
      {!isTeamMember ? <PrimaryButton label={props.tr("addSite")} onPress={props.onAddSite} /> : null}
      {props.sites.length === 0 ? <Text style={styles.emptyText}>{props.tr("noSites")}</Text> : null}
      {props.sites.map((site) => (
        <View key={site.siteId} style={[styles.siteRow, props.selectedSiteId === site.siteId ? styles.siteRowSelected : undefined]}>
          <Pressable
            accessibilityRole="button"
            style={styles.siteRowMain}
            onPress={() => (site.status === "ACTIVE" ? props.onSelectSite(site.siteId) : props.onOpenSite(site.siteId))}
          >
            <View style={styles.siteRowTop}>
              <Text style={styles.cardTitle}>{siteLabel(site)}</Text>
              {props.selectedSiteId === site.siteId ? <StatusBadge label={props.tr("selected")} tone="success" /> : null}
            </View>
            <Text style={styles.mutedText}>
              {site.status === "ACTIVE" ? props.tr("active") : props.tr("archived")} · {site.scanCount} {props.tr("scans")}
            </Text>
          </Pressable>
          {site.status === "ACTIVE" ? (
            <View style={styles.rowActions}>
              <SecondaryButton label={props.tr("viewDetails")} onPress={() => props.onOpenSite(site.siteId)} />
            </View>
          ) : null}
        </View>
      ))}
    </Panel>
  );
}

function SiteDetailView(props: {
  readonly tr: (key: CopyKey) => string;
  readonly session: StoredSession;
  readonly siteId: string | undefined;
  readonly sites: readonly SiteSummary[];
  readonly selectedSiteId: string;
  readonly setSelectedSiteId: (siteId: string) => void;
  readonly runTask: (task: () => Promise<void>, showSuccess?: boolean) => Promise<void>;
  readonly refreshSitesAndHistory: () => Promise<void>;
  readonly onEdit: (siteId: string) => void;
}) {
  const site = props.sites.find((item) => item.siteId === props.siteId);
  const isTeamMember = props.session.role === "TEAM_MEMBER";

  async function submitArchive(siteId: string): Promise<void> {
    await props.runTask(async () => {
      if (isTeamMember) {
        throw new Error(props.tr("permissionDenied"));
      }
      await archiveSite(props.session.token, siteId);
      await props.refreshSitesAndHistory();
    });
  }

  if (!site) {
    return (
      <Panel title={props.tr("siteDetail")}>
        <Text style={styles.emptyText}>{props.tr("siteNotFound")}</Text>
      </Panel>
    );
  }

  const active = site.status === "ACTIVE";

  return (
    <Panel title={props.tr("siteDetail")}>
      <View style={styles.siteDetailHeader}>
        <Text style={styles.cardTitle}>{siteLabel(site)}</Text>
        <StatusBadge label={active ? props.tr("active") : props.tr("archived")} tone={active ? "success" : "muted"} />
      </View>
      <DashboardRow label={props.tr("clientName")} value={site.clientName} />
      <DashboardRow label={props.tr("address")} value={[site.flatOrApartmentNo, site.buildingName, site.area, site.city].filter(Boolean).join(", ") || "-"} />
      <DashboardRow label={props.tr("scanHistory")} value={`${site.scanCount} ${props.tr("scans")}`} />
      <DashboardRow label={props.tr("selectedSite")} value={props.selectedSiteId === site.siteId ? props.tr("selected") : props.tr("notSelected")} />
      {active ? <PrimaryButton label={props.tr("useSite")} onPress={() => props.setSelectedSiteId(site.siteId)} /> : null}
      {!isTeamMember && active ? (
        <View style={styles.formBlock}>
          <SecondaryButton label={props.tr("editSite")} onPress={() => props.onEdit(site.siteId)} />
          <Pressable accessibilityRole="button" style={styles.archiveButton} onPress={() => void submitArchive(site.siteId)}>
            <Text style={styles.archiveText}>{props.tr("archiveSite")}</Text>
          </Pressable>
        </View>
      ) : null}
      {isTeamMember ? <Text style={styles.helperText}>{props.tr("teamMemberSiteReadOnly")}</Text> : null}
    </Panel>
  );
}

function SiteFormView(props: {
  readonly tr: (key: CopyKey) => string;
  readonly session: StoredSession;
  readonly siteId: string | undefined;
  readonly sites: readonly SiteSummary[];
  readonly setSelectedSiteId: (siteId: string) => void;
  readonly runTask: (task: () => Promise<void>, showSuccess?: boolean) => Promise<void>;
  readonly refreshSitesAndHistory: () => Promise<void>;
  readonly onSaved: (siteId: string) => void;
}) {
  const existingSite = props.sites.find((site) => site.siteId === props.siteId);
  const [siteForm, setSiteForm] = useState<SiteInput>(() => siteInputFromSummary(existingSite));
  const isEditing = Boolean(existingSite);
  const isTeamMember = props.session.role === "TEAM_MEMBER";

  useEffect(() => {
    setSiteForm(siteInputFromSummary(existingSite));
  }, [existingSite?.siteId]);

  async function submitSite(): Promise<void> {
    await props.runTask(async () => {
      if (isTeamMember) {
        throw new Error(props.tr("permissionDenied"));
      }
      const savedSite = isEditing && existingSite
        ? await updateSite(props.session.token, existingSite.siteId, cleanSiteInput(siteForm))
        : await createSite(props.session.token, cleanSiteInput(siteForm));
      props.setSelectedSiteId(savedSite.siteId);
      await props.refreshSitesAndHistory();
      props.onSaved(savedSite.siteId);
    });
  }

  if (isTeamMember) {
    return (
      <Panel title={props.tr("siteForm")}>
        <Text style={styles.helperText}>{props.tr("permissionDenied")}</Text>
      </Panel>
    );
  }

  return (
    <Panel title={isEditing ? props.tr("editSite") : props.tr("addSite")}>
      <Text style={styles.helperText}>{props.tr("siteFormHint")}</Text>
      <Field label={props.tr("clientName")} value={siteForm.clientName} onChangeText={(clientName) => setSiteForm({ ...siteForm, clientName })} />
      <Field label={props.tr("flat")} value={siteForm.flatOrApartmentNo ?? ""} onChangeText={(flatOrApartmentNo) => setSiteForm({ ...siteForm, flatOrApartmentNo })} />
      <Field label={props.tr("building")} value={siteForm.buildingName ?? ""} onChangeText={(buildingName) => setSiteForm({ ...siteForm, buildingName })} />
      <Field label={props.tr("area")} value={siteForm.area ?? ""} onChangeText={(area) => setSiteForm({ ...siteForm, area })} />
      <Field label={props.tr("city")} value={siteForm.city ?? ""} onChangeText={(city) => setSiteForm({ ...siteForm, city })} />
      <PrimaryButton label={props.tr("saveSite")} onPress={submitSite} />
    </Panel>
  );
}

function HistoryView(props: {
  readonly tr: (key: CopyKey) => string;
  readonly session: StoredSession;
  readonly history: readonly ScanHistoryEntry[];
  readonly onOpenDetail: (scanAttemptId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<HistoryFilter>("ALL");
  const [sort, setSort] = useState<HistorySort>("LATEST");
  const scope = describeHistoryScope({
    role: props.session.role,
    contractorId: props.session.contractorId,
    ...(props.session.teamMemberMobile ? { teamMemberMobile: props.session.teamMemberMobile } : {}),
  });
  const visibleHistory = presentScanHistory({ entries: props.history, filter, query, sort });

  return (
    <Panel title={props.tr("scanHistory")}>
      <Text style={styles.helperText}>
        {scope === "FULL_CONTRACTOR" ? props.tr("contractorHistoryScope") : props.tr("teamHistoryScope")}
      </Text>
      <Field label={props.tr("searchHistory")} value={query} onChangeText={setQuery} autoCapitalize="none" />
      <Text style={styles.overline}>{props.tr("filter")}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rewardFilters}>
        {historyFilterOptions(props.tr).map((option) => (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            style={[styles.filterChip, filter === option.value ? styles.filterChipActive : undefined]}
            onPress={() => setFilter(option.value)}
          >
            <Text style={[styles.filterChipText, filter === option.value ? styles.filterChipTextActive : undefined]}>{option.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.overline}>{props.tr("sort")}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rewardFilters}>
        {historySortOptions(props.tr).map((option) => (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            style={[styles.filterChip, sort === option.value ? styles.filterChipActive : undefined]}
            onPress={() => setSort(option.value)}
          >
            <Text style={[styles.filterChipText, sort === option.value ? styles.filterChipTextActive : undefined]}>{option.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {visibleHistory.length === 0 ? <Text style={styles.emptyText}>{props.tr("emptyHistory")}</Text> : null}
      {visibleHistory.map((entry) => (
        <HistoryRow key={entry.scanAttemptId} entry={entry} tr={props.tr} onPress={() => props.onOpenDetail(entry.scanAttemptId)} />
      ))}
    </Panel>
  );
}

function RewardsView(props: {
  readonly tr: (key: CopyKey) => string;
  readonly session: StoredSession;
  readonly catalog: RewardCatalogResponse | null;
  readonly balanceBook: readonly BalanceBookEntry[];
  readonly openReward: (rewardId: string) => void;
  readonly openBalanceBook: () => void;
}) {
  const [activeTab, setActiveTab] = useState<RewardsTab>("AVAILABLE");

  if (!props.catalog) {
    return (
      <Panel title={props.tr("rewards")}>
        <Text style={styles.helperText}>{props.tr("loading")}</Text>
      </Panel>
    );
  }

  const sections = splitRewardCatalog(props.catalog.items);
  const visibleRewards = rewardTabItems(sections, activeTab);

  return (
    <View style={styles.rewardStack}>
      <Text style={styles.pageTitle}>{props.tr("rewards")}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rewardTabsShell} contentContainerStyle={styles.rewardTabs}>
        {rewardTabOptions(props.tr, sections).map((tab) => (
          <Pressable
            accessibilityRole="button"
            key={tab.value}
            style={activeTab === tab.value ? styles.rewardTabActive : styles.rewardTab}
            onPress={() => setActiveTab(tab.value)}
          >
            <Text style={activeTab === tab.value ? styles.rewardTabTextActive : styles.rewardTabText}>{tab.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.bigBalanceCard}>
        <View style={styles.balanceHeaderRow}>
          <Text numberOfLines={1} style={styles.metricCardLabel}>{props.tr("pointsAvailable")}</Text>
          <View style={styles.tierPill}>
            <Text numberOfLines={1} style={styles.tierPillText}>{props.catalog.currentTier} {props.tr("member")}</Text>
          </View>
        </View>
        <Text style={styles.bigBalanceValue}>{props.catalog.pointsAvailable.toLocaleString("en-IN")}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(1, props.catalog.totalAccumulatedPoints / 30000) * 100}%` }]} />
        </View>
      </View>
      <View style={styles.rewardStatGrid}>
        <View style={styles.rewardStatCard}>
          <Text numberOfLines={1} style={styles.mutedText}>{props.tr("lifetimeCollected")}</Text>
          <Text style={styles.statValue}>{props.catalog.totalAccumulatedPoints.toLocaleString("en-IN")}</Text>
        </View>
        <View style={styles.rewardStatCard}>
          <Text numberOfLines={1} style={styles.mutedText}>{props.tr("tier")}</Text>
          <Text style={styles.statValue}>{props.catalog.currentTier}</Text>
        </View>
      </View>
      <View style={styles.rewardUtilityRow}>
        <SecondaryButton label={props.tr("balanceBook")} onPress={props.openBalanceBook} />
      </View>

      <Panel title={rewardPanelTitle(activeTab, props.tr)}>
        {visibleRewards.length === 0 ? <Text style={styles.emptyText}>{rewardEmptyText(activeTab, props.tr)}</Text> : null}
        {visibleRewards.map((reward) => (
          <RewardTile
            key={reward.rewardId}
            reward={reward}
            selected={false}
            tr={props.tr}
            onPress={() => props.openReward(reward.rewardId)}
          />
        ))}
      </Panel>
    </View>
  );
}

function RewardDetailScreen(props: {
  readonly tr: (key: CopyKey) => string;
  readonly session: StoredSession;
  readonly rewardId: string | undefined;
  readonly catalog: RewardCatalogResponse | null;
  readonly runTask: (task: () => Promise<void>, showSuccess?: boolean) => Promise<void>;
  readonly refreshRewards: (session?: StoredSession | null) => Promise<void>;
  readonly updateSessionFromRewardBalance: (
    session: StoredSession,
    rewards: { readonly currentTier: string; readonly totalAccumulatedPoints: number; readonly pointsAvailable: number },
  ) => Promise<void>;
}) {
  const reward = props.catalog?.items.find((item) => item.rewardId === props.rewardId) ?? props.catalog?.items[0];
  const [rewardNotice, setRewardNotice] = useState("");

  async function submitRedeem(nextReward: RewardCatalogTile): Promise<void> {
    setRewardNotice("");
    await props.runTask(async () => {
      const result = await redeemReward(props.session.token, nextReward.rewardId);
      await props.updateSessionFromRewardBalance(props.session, result.balance);
      await props.refreshRewards(props.session);
      setRewardNotice(`${props.tr("claimRaisedNotice")} ${result.claim.claimId}`);
    });
  }

  async function submitCancel(nextReward: RewardCatalogTile): Promise<void> {
    if (!nextReward.claimId) {
      return;
    }
    setRewardNotice("");
    await props.runTask(async () => {
      const result = await cancelRewardClaim(props.session.token, nextReward.claimId ?? "");
      await props.updateSessionFromRewardBalance(props.session, result.balance);
      await props.refreshRewards(props.session);
      setRewardNotice(props.tr("claimCancelledNotice"));
    });
  }

  return (
    <Panel title={props.tr("rewardDetail")}>
      {reward ? (
        <RewardDetail
          reward={reward}
          tr={props.tr}
          availablePoints={props.catalog?.pointsAvailable ?? props.session.contractor.availablePoints}
          notice={rewardNotice}
          onRedeem={submitRedeem}
          onCancel={submitCancel}
        />
      ) : (
        <Text style={styles.emptyText}>{props.tr("noRewards")}</Text>
      )}
    </Panel>
  );
}

function BalanceBookView(props: {
  readonly tr: (key: CopyKey) => string;
  readonly entries: readonly BalanceBookEntry[];
  readonly onOpenEntry: (ledgerEntryId: string) => void;
}) {
  const [bookFilter, setBookFilter] = useState<BalanceBookFilter>("ALL");
  const [bookQuery, setBookQuery] = useState("");
  const [bookSort, setBookSort] = useState<BalanceBookSort>("LATEST");
  const filteredBook = presentBalanceBook({
    entries: props.entries,
    filter: bookFilter,
    query: bookQuery,
    sort: bookSort,
  });

  return (
    <Panel title={props.tr("balanceBook")}>
      <Field label={props.tr("searchBalanceBook")} value={bookQuery} onChangeText={setBookQuery} autoCapitalize="none" />
      <Text style={styles.overline}>{props.tr("filter")}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rewardFilters}>
        {balanceBookFilterOptions(props.tr).map((option) => (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            style={[styles.filterChip, bookFilter === option.value ? styles.filterChipActive : undefined]}
            onPress={() => setBookFilter(option.value)}
          >
            <Text style={[styles.filterChipText, bookFilter === option.value ? styles.filterChipTextActive : undefined]}>{option.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.overline}>{props.tr("sort")}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rewardFilters}>
        {balanceBookSortOptions(props.tr).map((option) => (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            style={[styles.filterChip, bookSort === option.value ? styles.filterChipActive : undefined]}
            onPress={() => setBookSort(option.value)}
          >
            <Text style={[styles.filterChipText, bookSort === option.value ? styles.filterChipTextActive : undefined]}>{option.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {filteredBook.length === 0 ? <Text style={styles.emptyText}>{props.tr("noLedger")}</Text> : null}
      {filteredBook.map((entry) => (
        <BalanceBookRow key={entry.ledgerEntryId} entry={entry} tr={props.tr} onPress={() => props.onOpenEntry(entry.ledgerEntryId)} />
      ))}
    </Panel>
  );
}

function HistoryDetailView(props: {
  readonly tr: (key: CopyKey) => string;
  readonly entry: ScanHistoryEntry | undefined;
  readonly onAddToAccount: () => void;
  readonly sessionRole: StoredSession["role"];
}) {
  if (!props.entry) {
    return (
      <Panel title={props.tr("scanDetail")}>
        <Text style={styles.emptyText}>{props.tr("noHistoryEntry")}</Text>
      </Panel>
    );
  }

  const tone = statusTone(props.entry.result);
  const actorLabel = props.entry.actorRole === "TEAM_MEMBER" ? props.tr("teamMember") : props.tr("contractor");
  const canShowPoints = props.sessionRole === "CONTRACTOR";
  const creditedPointsLabel = typeof props.entry.creditedPoints === "number"
    ? `${props.entry.creditedPoints > 0 ? "+" : ""}${props.entry.creditedPoints}`
    : "0";
  const detailTitle = props.entry.productSku ?? props.entry.qrCodeId ?? props.entry.scanAttemptId;

  return (
    <Panel title={props.tr("scanDetail")}>
      <View style={styles.detailHeader}>
        <Text style={styles.cardTitle}>{detailTitle}</Text>
        <StatusBadge label={scanResultDisplayLabel(props.entry.result, props.tr)} tone={tone} />
      </View>
      {canShowPoints ? (
        <View style={styles.scanCartMetricRow}>
          <Metric label={props.tr("qrValue")} value={typeof props.entry.qrValuePoints === "number" ? String(props.entry.qrValuePoints) : "-"} emphasis />
          <Metric label={props.tr("creditedPoints")} value={creditedPointsLabel} />
        </View>
      ) : null}
      <DashboardRow label={props.tr("attemptId")} value={props.entry.scanAttemptId} />
      <DashboardRow label={props.tr("scannedAt")} value={formatDateTime(props.entry.createdAt)} />
      <DashboardRow label={props.tr("actor")} value={actorLabel} />
      {props.entry.teamMemberMobile ? <DashboardRow label={props.tr("teamMemberMobile")} value={props.entry.teamMemberMobile} /> : null}
      {props.entry.siteLabel || props.entry.siteId ? <DashboardRow label={props.tr("selectedSite")} value={props.entry.siteLabel ?? props.entry.siteId ?? "-"} /> : null}
      {props.entry.productSku ? <DashboardRow label={props.tr("product")} value={props.entry.productSku} /> : null}
      {props.entry.qrCodeId ? <DashboardRow label={props.tr("qrCode")} value={props.entry.qrCodeId} /> : null}
      {props.entry.qrUnitId ? <DashboardRow label={props.tr("qrUnit")} value={props.entry.qrUnitId} /> : null}
      {canShowPoints ? <DashboardRow label={props.tr("creditedPoints")} value={creditedPointsLabel} /> : null}
      {props.entry.failureReason ? <DashboardRow label={props.tr("failureReason")} value={props.entry.failureReason} /> : null}
      {props.entry.result === "RESERVED" ? (
        <View style={styles.formBlock}>
          <PrimaryButton label={props.tr("addToAccount")} onPress={props.onAddToAccount} />
        </View>
      ) : null}
    </Panel>
  );
}

function BalanceBookDetailView(props: {
  readonly tr: (key: CopyKey) => string;
  readonly entry: BalanceBookEntry | undefined;
}) {
  if (!props.entry) {
    return (
      <Panel title={props.tr("ledgerDetail")}>
        <Text style={styles.emptyText}>{props.tr("noLedgerEntry")}</Text>
      </Panel>
    );
  }

  const pointsValue = props.entry.pointsDelta === 0 ? "0" : `${props.entry.pointsDelta > 0 ? "+" : ""}${props.entry.pointsDelta}`;

  return (
    <Panel title={props.tr("ledgerDetail")}>
      <View style={styles.detailHeader}>
        <Text style={styles.cardTitle}>{balanceBookTitle(props.entry)}</Text>
        {props.entry.negativeBalance ? <StatusBadge label={props.tr("negativeBalance")} tone="danger" /> : null}
      </View>
      <DashboardRow label={props.tr("ledgerEntryId")} value={props.entry.ledgerEntryId} />
      <DashboardRow label={props.tr("createdAt")} value={formatDateTime(props.entry.createdAt)} />
      <DashboardRow label={props.tr("eventType")} value={props.entry.type} />
      <DashboardRow label={props.tr("pointsChange")} value={pointsValue} />
      <DashboardRow label={props.tr("balanceAfter")} value={String(props.entry.balanceAfter)} />
      <DashboardRow label={props.tr("sourceType")} value={props.entry.sourceType} />
      <DashboardRow label={props.tr("sourceReference")} value={props.entry.sourceId} />
      {props.entry.rewardName ? <DashboardRow label={props.tr("reward")} value={props.entry.rewardName} /> : null}
      {props.entry.claimId ? <DashboardRow label={props.tr("claimId")} value={props.entry.claimId} /> : null}
      {props.entry.rewardClaimId ? <DashboardRow label={props.tr("rewardClaimId")} value={props.entry.rewardClaimId} /> : null}
      {props.entry.qrUnitId ? <DashboardRow label={props.tr("qrUnit")} value={props.entry.qrUnitId} /> : null}
    </Panel>
  );
}

function RewardTile(props: {
  readonly reward: RewardCatalogTile;
  readonly selected: boolean;
  readonly tr: (key: CopyKey) => string;
  readonly onPress: () => void;
  readonly compact?: boolean;
}) {
  const requiredPoints = Math.max(1, props.reward.pointsRequired);
  const progress = Math.max(0.04, Math.min(1, (requiredPoints - props.reward.pointsGap) / requiredPoints));
  const tone = rewardTone(props.reward);
  return (
    <Pressable
      accessibilityRole="button"
      style={[props.compact ? styles.rewardTileCompact : styles.rewardTile, props.selected ? styles.rewardTileSelected : undefined]}
      onPress={props.onPress}
    >
      <RewardImage reward={props.reward} variant={props.compact ? "compactTile" : "tile"} />
      <View style={styles.rewardTileMain}>
        <View style={styles.rewardTileHeader}>
          <Text numberOfLines={2} style={styles.rewardTileTitle}>{props.reward.name}</Text>
          <StatusBadge label={rewardStatusLabel(props.reward, props.tr)} tone={tone} />
        </View>
        <View style={styles.rewardTileMetaGrid}>
          <View style={styles.rewardTileMetaBox}>
            <Text style={styles.overline}>{props.tr("requiredPoints")}</Text>
            <Text style={styles.rewardTileMetaValue}>{props.reward.displayValue}</Text>
          </View>
          <View style={styles.rewardTileMetaBox}>
            <Text style={styles.overline}>{props.tr("tier")}</Text>
            <Text style={styles.rewardTileMetaValue}>{props.reward.tierRequired ?? "Silver"}</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text numberOfLines={2} style={styles.rewardGap}>{rewardGapLabel(props.reward, props.tr)}</Text>
        {props.reward.claimId ? <Text numberOfLines={1} style={styles.claimText}>{props.tr("claimId")}: {props.reward.claimId}</Text> : null}
        {!props.compact ? <Text numberOfLines={2} style={styles.mutedText}>{props.reward.description ?? props.reward.displayValue}</Text> : null}
      </View>
    </Pressable>
  );
}

function RewardDetail(props: {
  readonly reward: RewardCatalogTile;
  readonly tr: (key: CopyKey) => string;
  readonly availablePoints: number;
  readonly notice: string;
  readonly onRedeem: (reward: RewardCatalogTile) => Promise<void>;
  readonly onCancel: (reward: RewardCatalogTile) => Promise<void>;
}) {
  const redeemDisabled = props.reward.status !== "ELIGIBLE";
  const balanceAfterClaim = props.availablePoints - props.reward.pointsRequired;
  return (
    <View style={styles.rewardDetail}>
      <RewardImage reward={props.reward} variant="detail" />
      {props.notice ? <Text style={styles.successNotice}>{props.notice}</Text> : null}
      <View style={styles.rewardDetailTop}>
        <View style={styles.rewardDetailCopy}>
          <Text style={styles.cardTitle}>{props.reward.name}</Text>
          <Text style={styles.mutedText}>{props.reward.description ?? props.reward.displayValue}</Text>
          <Text style={styles.rewardMetaLine}>
            {props.reward.displayValue} · {props.reward.pointsRequired.toLocaleString("en-IN")} {props.tr("points")}
          </Text>
          {props.reward.claimId ? (
            <Text style={styles.claimText}>
              {props.tr("claimId")}: {props.reward.claimId}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.rewardMetaRow}>
        <Metric label={props.tr("requiredPoints")} value={String(props.reward.pointsRequired)} emphasis />
        <Metric label={props.tr("tier")} value={props.reward.tierRequired ?? "Silver"} emphasis />
      </View>
      {props.reward.status === "ELIGIBLE" ? (
        <DashboardRow label={props.tr("balanceAfterClaim")} value={String(balanceAfterClaim)} />
      ) : null}
      {props.reward.status === "LOCKED" ? (
        <DashboardRow label={props.tr("pointsNeeded")} value={String(props.reward.pointsGap)} />
      ) : null}
      {props.reward.status === "CHOSEN" ? (
        <>
          <DashboardRow label={props.tr("pointsSpent")} value={String(props.reward.pointsRequired)} />
          <Text style={styles.helperText}>{props.tr("cancelCutoff")}</Text>
        </>
      ) : null}
      {props.reward.status === "CHOSEN" ? (
        <PrimaryButton label={props.tr("cancelReward")} onPress={() => void props.onCancel(props.reward)} />
      ) : (
        <Pressable
          accessibilityRole="button"
          disabled={redeemDisabled}
          style={({ pressed }) => [
            styles.primaryButton,
            redeemDisabled ? styles.disabledButton : undefined,
            pressed ? styles.pressed : undefined,
          ]}
          onPress={() => void props.onRedeem(props.reward)}
        >
          <Text style={styles.primaryButtonText}>
            {props.reward.status === "FULFILLED" ? props.tr("fulfilled") : props.tr("redeemNow")}
          </Text>
        </Pressable>
      )}
      {redeemDisabled && props.reward.status === "LOCKED" ? (
        <Text style={styles.helperText}>{rewardGapLabel(props.reward, props.tr)}</Text>
      ) : null}
    </View>
  );
}

function RewardImage(props: { readonly reward: RewardCatalogTile; readonly variant: "compactTile" | "tile" | "detail" }) {
  const frameStyle =
    props.variant === "detail"
      ? styles.rewardImageDetailFrame
      : props.variant === "compactTile"
        ? styles.rewardImageCompactFrame
        : styles.rewardImageTileFrame;
  const imageStyle = props.variant === "detail" ? styles.rewardImageDetail : styles.rewardImageTile;
  const imageUrl = props.reward.imageUrl;

  if (imageUrl && !imageUrl.startsWith("data:image/svg+xml")) {
    return (
      <View style={frameStyle}>
        <Image source={{ uri: imageUrl }} style={imageStyle} resizeMode="cover" />
      </View>
    );
  }

  const visual = rewardVisualSpec(props.reward.name);
  return (
    <View style={[frameStyle, styles.rewardIllustrationFrame, { backgroundColor: visual.background }]}>
      <View style={[styles.rewardIllustrationBody, { backgroundColor: visual.accent }]}>
        <View style={styles.rewardIllustrationHandle} />
        <Text style={[styles.rewardIllustrationCode, { color: visual.foreground }]}>{visual.code}</Text>
      </View>
      <Text style={styles.rewardIllustrationLabel}>{visual.label}</Text>
    </View>
  );
}

function BalanceBookRow(props: { readonly entry: BalanceBookEntry; readonly tr: (key: CopyKey) => string; readonly onPress: () => void }) {
  const positive = props.entry.pointsDelta > 0;
  const zero = props.entry.pointsDelta === 0;
  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.balanceBookRow, pressed ? styles.pressed : undefined]} onPress={props.onPress}>
      <View style={styles.historyMain}>
        <Text numberOfLines={2} style={styles.cardTitle}>{balanceBookTitle(props.entry)}</Text>
        <Text numberOfLines={1} style={styles.mutedText}>{new Date(props.entry.createdAt).toLocaleString()}</Text>
        {props.entry.claimId ? (
          <Text numberOfLines={1} style={styles.mutedText}>
            {props.tr("claimId")}: {props.entry.claimId}
          </Text>
        ) : null}
      </View>
      <View style={styles.historyRight}>
        <Text style={[styles.historyPoints, !positive && !zero ? styles.historyPointsNegative : undefined]}>
          {zero ? "0" : `${positive ? "+" : ""}${props.entry.pointsDelta}`}
        </Text>
        <Text style={styles.mutedText}>{props.entry.balanceAfter}</Text>
        {props.entry.negativeBalance ? <StatusBadge label={props.tr("negativeBalance")} tone="danger" /> : null}
      </View>
    </Pressable>
  );
}

function SiteChooser(props: {
  readonly sites: readonly SiteSummary[];
  readonly selectedSiteId: string;
  readonly setSelectedSiteId: (siteId: string) => void;
  readonly tr: (key: CopyKey) => string;
}) {
  const activeSites = props.sites.filter((site) => site.status === "ACTIVE");
  return (
    <View style={styles.siteChooser}>
      <Text style={styles.sectionTitle}>{props.tr("selectOrChangeSite")}</Text>
      {activeSites.length === 0 ? <Text style={styles.emptyText}>{props.tr("noSites")}</Text> : null}
      <View style={styles.siteChoiceList}>
        {activeSites.map((site) => (
          <Pressable
            accessibilityRole="button"
            key={site.siteId}
            style={[styles.siteChoiceRow, props.selectedSiteId === site.siteId ? styles.siteChoiceRowSelected : undefined]}
            onPress={() => props.setSelectedSiteId(site.siteId)}
          >
            <View style={styles.siteRowTop}>
              <Text numberOfLines={1} style={styles.cardTitle}>{site.clientName}</Text>
              {props.selectedSiteId === site.siteId ? <StatusBadge label={props.tr("selected")} tone="success" /> : null}
            </View>
            <Text numberOfLines={1} style={styles.mutedText}>{siteLabel(site)}</Text>
          </Pressable>
        ))}
      </View>
      {activeSites.length > 0 && !props.selectedSiteId ? <Text style={styles.helperText}>{props.tr("selectSiteBeforeScan")}</Text> : null}
    </View>
  );
}

function HistoryRow(props: { readonly entry: ScanHistoryEntry; readonly onPress: () => void; readonly tr: (key: CopyKey) => string }) {
  const tone = statusTone(props.entry.result);
  const pointLabel = scanHistoryPointLabel(props.entry);
  const actorLabel = props.entry.actorRole === "TEAM_MEMBER" ? props.tr("teamMember") : props.tr("contractor");
  const primaryLabel = props.entry.productSku ?? props.entry.qrCodeId ?? props.tr("itemReference");
  const referenceLabel = props.entry.qrCodeId ?? props.entry.qrUnitId ?? props.entry.scanAttemptId;
  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.historyRow, pressed ? styles.pressed : undefined]} onPress={props.onPress}>
      <HistoryMarker teamMember={props.entry.actorRole === "TEAM_MEMBER"} tone={tone} />
      <View style={styles.historyMain}>
        <Text numberOfLines={2} style={styles.historyTitle}>{primaryLabel}</Text>
        <Text numberOfLines={1} style={styles.mutedText}>{props.entry.siteLabel ?? props.entry.siteId ?? props.tr("noSite")}</Text>
        <Text numberOfLines={1} style={styles.historyMeta}>
          {actorLabel} · {formatDateTime(props.entry.createdAt)}
        </Text>
        <Text numberOfLines={1} style={styles.historyReference}>{referenceLabel}</Text>
      </View>
      <View style={styles.historyRight}>
        {pointLabel ? <Text style={styles.historyPoints}>{pointLabel}</Text> : null}
        <StatusBadge label={scanResultDisplayLabel(props.entry.result, props.tr)} tone={tone} />
      </View>
    </Pressable>
  );
}

function HistoryMarker(props: { readonly teamMember: boolean; readonly tone: StatusTone }) {
  const active = props.tone === "success";
  if (props.teamMember) {
    return (
      <View style={[styles.historyMarker, active ? styles.historyMarkerSuccess : undefined]}>
        <View style={styles.historyMarkerQrGrid}>
          {[0, 1, 2, 3].map((cell) => (
            <View key={cell} style={[styles.historyMarkerQrCell, active ? styles.historyMarkerGlyphActive : undefined]} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.historyMarker, active ? styles.historyMarkerSuccess : undefined]}>
      <View style={[styles.historyMarkerPersonHead, active ? styles.historyMarkerGlyphActive : undefined]} />
      <View style={[styles.historyMarkerPersonBody, active ? styles.historyMarkerGlyphActive : undefined]} />
    </View>
  );
}

function BottomTabs(props: {
  readonly activeView: ViewKey;
  readonly setActiveView: (view: ViewKey) => void;
  readonly tabs: readonly ViewKey[];
  readonly tr: (key: CopyKey) => string;
}) {
  const labels: Record<ViewKey, CopyKey> = {
    home: "home",
    scan: "scan",
    sites: "sites",
    history: "history",
    rewards: "rewards",
  };
  const symbols: Record<ViewKey, string> = {
    home: "HM",
    scan: "QR",
    sites: "ST",
    history: "HI",
    rewards: "RW",
  };
  return (
    <View style={styles.bottomTabs}>
      {props.tabs.map((tab) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={props.tr(labels[tab])}
          key={tab}
          style={({ pressed }) => [
            styles.tabButton,
            tab === "scan" ? styles.tabButtonScan : undefined,
            props.activeView === tab ? styles.tabButtonActive : undefined,
            pressed ? styles.pressed : undefined,
          ]}
          onPress={() => props.setActiveView(tab)}
        >
          <View
            style={[
              styles.tabSymbol,
              tab === "scan" ? styles.tabSymbolScan : undefined,
              props.activeView === tab ? styles.tabSymbolActive : undefined,
            ]}
          >
            <Text
              style={[
                styles.tabSymbolText,
                tab === "scan" ? styles.tabSymbolTextScan : undefined,
                props.activeView === tab ? styles.tabSymbolTextActive : undefined,
              ]}
            >
              {symbols[tab]}
            </Text>
          </View>
          <Text style={[styles.tabText, props.activeView === tab ? styles.tabTextActive : undefined]}>{props.tr(labels[tab])}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Panel(props: { readonly title: string; readonly children: ReactNode }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{props.title}</Text>
      {props.children}
    </View>
  );
}

function Field(props: {
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly keyboardType?: "default" | "phone-pad" | "number-pad";
  readonly secureTextEntry?: boolean;
  readonly autoCapitalize?: "none" | "sentences" | "words" | "characters";
  readonly revealLabel?: string;
  readonly hideLabel?: string;
}) {
  const [showSecureText, setShowSecureText] = useState(false);
  const secure = Boolean(props.secureTextEntry);
  const input = (
    <TextInput
      accessibilityLabel={props.label}
      style={[
        styles.input,
        props.keyboardType === "phone-pad" ? styles.phoneInput : undefined,
        secure && props.keyboardType === "number-pad" ? styles.pinInput : undefined,
        secure ? styles.secureInput : undefined,
      ]}
      value={props.value}
      onChangeText={props.onChangeText}
      keyboardType={props.keyboardType ?? "default"}
      secureTextEntry={secure && !showSecureText}
      autoCapitalize={props.autoCapitalize ?? "words"}
      autoCorrect={false}
      maxLength={props.keyboardType === "phone-pad" ? 10 : secure && props.keyboardType === "number-pad" ? 4 : undefined}
      placeholderTextColor={theme.colors.muted}
    />
  );

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      {secure ? (
        <View style={styles.secureInputWrap}>
          {input}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showSecureText ? props.hideLabel ?? "Hide" : props.revealLabel ?? "Show"}
            onPress={() => setShowSecureText((current) => !current)}
            style={styles.secureRevealButton}
          >
            <Text style={styles.secureRevealText}>{showSecureText ? props.hideLabel ?? "Hide" : props.revealLabel ?? "Show"}</Text>
          </Pressable>
        </View>
      ) : (
        input
      )}
      {props.keyboardType === "phone-pad" ? (
        <View style={[styles.phonePrefix, styles.noPointerEvents]}>
          <Text style={styles.phonePrefixText}>+91</Text>
        </View>
      ) : null}
    </View>
  );
}

function PinField(props: {
  readonly label: string;
  readonly onChangeText: (value: string) => void;
  readonly value: string;
  readonly revealLabel: string;
  readonly hideLabel: string;
}) {
  const [showPin, setShowPin] = useState(false);
  const digits = props.value.slice(0, 4).split("");
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <View style={styles.pinWrap}>
        <TextInput
          accessibilityLabel={props.label}
          autoCorrect={false}
          keyboardType="number-pad"
          maxLength={4}
          onChangeText={(nextValue) => props.onChangeText(nextValue.replace(/\D/g, "").slice(0, 4))}
          secureTextEntry={!showPin}
          style={styles.pinHiddenInput}
          value={props.value}
        />
        <View style={[styles.pinBoxes, styles.noPointerEvents]}>
          {[0, 1, 2, 3].map((index) => (
            <View key={index} style={[styles.pinBox, props.value.length === index ? styles.pinBoxActive : undefined]}>
              <Text style={styles.pinBoxText}>{digits[index] ? (showPin ? digits[index] : "•") : ""}</Text>
            </View>
          ))}
        </View>
      </View>
      <Pressable accessibilityRole="button" onPress={() => setShowPin((current) => !current)} style={styles.pinRevealButton}>
        <Text style={styles.pinRevealText}>{showPin ? props.hideLabel : props.revealLabel}</Text>
      </Pressable>
    </View>
  );
}

function TrustPanel(props: { readonly body: string; readonly title: string }) {
  return (
    <View style={styles.trustPanel}>
      <View style={styles.trustIcon}>
        <Text style={styles.trustIconText}>✓</Text>
      </View>
      <View style={styles.trustCopy}>
        <Text style={styles.trustTitle}>{props.title}</Text>
        <Text style={styles.trustBody}>{props.body}</Text>
      </View>
    </View>
  );
}

function ContractorAvatar(props: { readonly large?: boolean | undefined; readonly name: string; readonly photoUrl?: string | undefined }) {
  const frameStyle = props.large ? styles.avatarLarge : styles.avatar;
  if (props.photoUrl) {
    return <Image source={{ uri: props.photoUrl }} style={frameStyle} />;
  }

  return (
    <View style={frameStyle}>
      <Text style={styles.avatarText}>{initials(props.name)}</Text>
    </View>
  );
}

function PrimaryButton(props: { readonly disabled?: boolean; readonly label: string; readonly onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: props.disabled }}
      disabled={props.disabled}
      style={({ pressed }) => [
        styles.primaryButton,
        props.disabled ? styles.disabledButton : undefined,
        pressed ? styles.pressed : undefined,
      ]}
      onPress={props.onPress}
    >
      <Text style={styles.primaryButtonText}>{props.label}</Text>
    </Pressable>
  );
}

function SecondaryButton(props: { readonly label: string; readonly onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : undefined]} onPress={props.onPress}>
      <Text style={styles.secondaryButtonText}>{props.label}</Text>
    </Pressable>
  );
}

function Metric(props: { readonly label: string; readonly value: string; readonly emphasis?: boolean }) {
  return (
    <View style={[styles.metric, props.emphasis ? styles.metricEmphasis : undefined]}>
      <Text style={[styles.metricValue, props.emphasis ? styles.metricValueEmphasis : undefined]}>{props.value}</Text>
      <Text style={[styles.metricLabel, props.emphasis ? styles.metricLabelEmphasis : undefined]}>{props.label}</Text>
    </View>
  );
}

function QuickAction(props: {
  readonly icon: "history" | "ledger";
  readonly title: string;
  readonly caption: string;
  readonly onPress: () => void;
  readonly primary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.title}
      style={({ pressed }) => [styles.quickAction, props.primary ? styles.quickActionPrimary : undefined, pressed ? styles.pressed : undefined]}
      onPress={props.onPress}
    >
      <QuickActionIcon icon={props.icon} primary={Boolean(props.primary)} />
      <Text style={[styles.quickTitle, props.primary ? styles.quickTitlePrimary : undefined]}>{props.title}</Text>
      <Text style={[styles.quickCaption, props.primary ? styles.quickCaptionPrimary : undefined]}>{props.caption}</Text>
    </Pressable>
  );
}

function QuickActionIcon(props: { readonly icon: "history" | "ledger"; readonly primary?: boolean }) {
  const lineStyle = props.primary ? styles.quickIconLinePrimary : styles.quickIconLine;
  if (props.icon === "history") {
    return (
      <View style={[styles.quickIcon, props.primary ? styles.quickIconPrimary : undefined]}>
        <View style={styles.quickClockFace}>
          <View style={lineStyle} />
          <View style={[lineStyle, styles.quickClockHand]} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.quickIcon, props.primary ? styles.quickIconPrimary : undefined]}>
      <View style={[lineStyle, styles.quickLedgerLineWide]} />
      <View style={[lineStyle, styles.quickLedgerLine]} />
      <View style={[lineStyle, styles.quickLedgerLineWide]} />
    </View>
  );
}

function StatusBadge(props: { readonly label: string; readonly tone: StatusTone }) {
  const color = {
    success: theme.colors.success,
    danger: theme.colors.danger,
    warning: theme.colors.warning,
    muted: theme.colors.muted,
  }[props.tone];
  return (
    <View style={[styles.statusBadge, { borderColor: color }]}>
      <Text style={[styles.statusText, { color }]}>{props.label}</Text>
    </View>
  );
}

function InfoStrip(props: { readonly text: string }) {
  return (
    <View style={styles.infoStrip}>
      <Text style={styles.infoText}>{props.text}</Text>
    </View>
  );
}

function Toast(props: { readonly tone: StatusTone; readonly message: string }) {
  return (
    <View style={[styles.toast, props.tone === "danger" ? styles.toastDanger : styles.toastSuccess]}>
      <Text style={styles.toastText}>{props.message}</Text>
    </View>
  );
}

function toStoredSession(
  role: "CONTRACTOR" | "TEAM_MEMBER",
  contractor: PublicContractor,
  token: string,
  expiresAt: string,
  teamMemberMobile?: string,
): StoredSession {
  return {
    token,
    role,
    contractorId: contractor.contractorId,
    ...(teamMemberMobile ? { teamMemberMobile } : {}),
    expiresAt,
    contractor: {
      name: contractor.name,
      mobileNumber: contractor.mobileNumber,
      ...(contractor.photoUrl ? { photoUrl: contractor.photoUrl } : {}),
      ...(contractor.tier ? { tier: contractor.tier } : {}),
      totalAccumulatedPoints: contractor.totalAccumulatedPoints,
      availablePoints: contractor.availablePoints,
    },
  };
}

function toRecentContractor(contractor: PublicContractor): StoredRecentContractor {
  return {
    contractorId: contractor.contractorId,
    name: contractor.name,
    mobileNumber: contractor.mobileNumber,
    ...(contractor.photoUrl ? { photoUrl: contractor.photoUrl } : {}),
    savedAt: new Date().toISOString(),
  };
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? "V";
  const second = words[1]?.[0] ?? "R";
  return `${first}${second}`.toUpperCase();
}

function siteLabel(site: SiteSummary): string {
  return [site.clientName, site.flatOrApartmentNo, site.buildingName, site.area, site.city].filter(Boolean).join(", ");
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function readFileAsDataUrl(file: unknown): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Selected image could not be read."));
      }
    };
    reader.onerror = () => reject(new Error("Selected image could not be read."));
    reader.readAsDataURL(file as Blob);
  });
}

function cleanSiteInput(input: SiteInput): SiteInput {
  return {
    clientName: input.clientName.trim(),
    ...(input.flatOrApartmentNo?.trim() ? { flatOrApartmentNo: input.flatOrApartmentNo.trim() } : {}),
    ...(input.buildingName?.trim() ? { buildingName: input.buildingName.trim() } : {}),
    ...(input.area?.trim() ? { area: input.area.trim() } : {}),
    ...(input.city?.trim() ? { city: input.city.trim() } : {}),
  };
}

function historyFilterOptions(
  tr: (key: CopyKey) => string,
): readonly { readonly label: string; readonly value: HistoryFilter }[] {
  return [
    { label: tr("all"), value: "ALL" },
    { label: tr("success"), value: "SUCCESS" },
    { label: tr("failed"), value: "FAILED" },
    { label: tr("contractorScans"), value: "CONTRACTOR" },
    { label: tr("teamMemberScans"), value: "TEAM_MEMBER" },
  ];
}

function historySortOptions(
  tr: (key: CopyKey) => string,
): readonly { readonly label: string; readonly value: HistorySort }[] {
  return [
    { label: tr("latest"), value: "LATEST" },
    { label: tr("product"), value: "PRODUCT" },
    { label: tr("pointsHigh"), value: "POINTS" },
  ];
}

function balanceBookFilterOptions(
  tr: (key: CopyKey) => string,
): readonly { readonly label: string; readonly value: BalanceBookFilter }[] {
  return [
    { label: tr("all"), value: "ALL" },
    { label: tr("credits"), value: "CREDITS" },
    { label: tr("rewardClaims"), value: "REWARD_CLAIMS" },
    { label: tr("rewardCancellations"), value: "REWARD_CANCELLATIONS" },
    { label: tr("qrReversals"), value: "QR_REVERSALS" },
    { label: tr("rewardRevocations"), value: "REWARD_REVOCATIONS" },
  ];
}

function balanceBookSortOptions(
  tr: (key: CopyKey) => string,
): readonly { readonly label: string; readonly value: BalanceBookSort }[] {
  return [
    { label: tr("latest"), value: "LATEST" },
    { label: tr("oldest"), value: "OLDEST" },
    { label: tr("pointsHigh"), value: "POINTS_HIGH" },
    { label: tr("pointsLow"), value: "POINTS_LOW" },
  ];
}

function rewardTabOptions(
  tr: (key: CopyKey) => string,
  sections: RewardCatalogSections,
): readonly { readonly label: string; readonly value: RewardsTab }[] {
  return [
    { label: `${tr("availableRewards")} (${sections.available.length})`, value: "AVAILABLE" },
    { label: `${tr("chosen")} (${sections.claims.length})`, value: "CLAIMS" },
    { label: `${tr("deliveredRewards")} (${sections.delivered.length})`, value: "DELIVERED" },
  ];
}

function rewardTabItems(sections: RewardCatalogSections, tab: RewardsTab): readonly RewardCatalogTile[] {
  if (tab === "CLAIMS") {
    return sections.claims;
  }
  if (tab === "DELIVERED") {
    return sections.delivered;
  }
  return sections.available;
}

function rewardPanelTitle(tab: RewardsTab, tr: (key: CopyKey) => string): string {
  if (tab === "CLAIMS") {
    return tr("chosen");
  }
  if (tab === "DELIVERED") {
    return tr("deliveredRewards");
  }
  return tr("availableRewards");
}

function rewardEmptyText(tab: RewardsTab, tr: (key: CopyKey) => string): string {
  if (tab === "CLAIMS") {
    return tr("noClaimRaised");
  }
  if (tab === "DELIVERED") {
    return tr("noDeliveredRewards");
  }
  return tr("noRewards");
}

function siteInputFromSummary(site: SiteSummary | undefined): SiteInput {
  if (!site) {
    return emptySiteForm;
  }
  return {
    clientName: site.clientName,
    flatOrApartmentNo: site.flatOrApartmentNo ?? "",
    buildingName: site.buildingName ?? "",
    area: site.area ?? "",
    city: site.city ?? "",
  };
}

function rewardTone(reward: RewardCatalogTile): StatusTone {
  if (reward.status === "ELIGIBLE" || reward.status === "FULFILLED") {
    return "success";
  }
  if (reward.status === "CHOSEN") {
    return "warning";
  }
  return "muted";
}

function rewardStatusLabel(reward: RewardCatalogTile, tr: (key: CopyKey) => string): string {
  if (reward.status === "ELIGIBLE") {
    return tr("eligible");
  }
  if (reward.status === "CHOSEN") {
    return tr("chosen");
  }
  if (reward.status === "FULFILLED") {
    return tr("fulfilled");
  }
  return tr("locked");
}

function rewardGapLabel(reward: RewardCatalogTile, tr: (key: CopyKey) => string): string {
  if (reward.status === "CHOSEN" && reward.claimId) {
    return `${tr("claimId")}: ${reward.claimId}`;
  }
  if (reward.status === "FULFILLED") {
    return tr("fulfilled");
  }
  if (reward.tierGap) {
    return `${tr("tierNeeded")}: ${reward.tierGap}`;
  }
  if (reward.pointsGap > 0) {
    return `${tr("pointsNeeded")}: ${reward.pointsGap}`;
  }
  return reward.displayValue;
}

function rewardCode(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return `${words[0]?.[0] ?? "R"}${words[1]?.[0] ?? "W"}`.toUpperCase();
}

function rewardVisualSpec(name: string): {
  readonly accent: string;
  readonly background: string;
  readonly code: string;
  readonly foreground: string;
  readonly label: string;
} {
  const normalized = name.toLowerCase();
  if (normalized.includes("toolbox")) {
    return { accent: "#F49A32", background: "#DFF1F3", code: "TB", foreground: "#003D43", label: "Tool kit" };
  }
  if (normalized.includes("stripper") || normalized.includes("wire")) {
    return { accent: "#713D10", background: "#FFF0DF", code: "WS", foreground: "#FFFFFF", label: "Hand tools" };
  }
  if (normalized.includes("air fryer")) {
    return { accent: "#3E4F5B", background: "#EAF3F5", code: "AF", foreground: "#FFFFFF", label: "Appliance" };
  }
  if (normalized.includes("drill")) {
    return { accent: "#00535B", background: "#DFF1F3", code: "DR", foreground: "#FFFFFF", label: "Power tool" };
  }
  if (normalized.includes("tv")) {
    return { accent: "#1B1C1C", background: "#EAF3F5", code: "TV", foreground: "#FFFFFF", label: "Electronics" };
  }
  return { accent: "#00535B", background: "#EAF3F5", code: rewardCode(name), foreground: "#FFFFFF", label: "Reward" };
}

function scanFailureFromError(error: unknown, tr: (key: CopyKey) => string): ScanFailureViewModel {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("already") || message.includes("not scannable") || message.includes("scanned_claimed")) {
    return {
      title: tr("alreadyScanned"),
      body: tr("alreadyScannedBody"),
      tone: "warning",
    };
  }
  if (message.includes("expired")) {
    return {
      title: tr("expiredQr"),
      body: tr("expiredQrBody"),
      tone: "danger",
    };
  }
  if (message.includes("invalid") || message.includes("replaced")) {
    return {
      title: tr("invalidQr"),
      body: tr("invalidQrBody"),
      tone: "danger",
    };
  }
  if (message.includes("cart") && message.includes("cap")) {
    return {
      title: tr("cartLimitReached"),
      body: tr("cartLimitReachedBody"),
      tone: "warning",
    };
  }
  return {
    title: tr("scanFailed"),
    body: error instanceof Error ? error.message : tr("error"),
    tone: "danger",
  };
}

function dashboardRecentScanValue(entry: ScanHistoryEntry, tr: (key: CopyKey) => string): string {
  const label = scanResultDisplayLabel(entry.result, tr);
  const site = entry.siteLabel ?? tr("noSite");
  const reference = entry.productSku ?? entry.qrCodeId ?? "";
  return [label, site, reference].filter(Boolean).join(" · ");
}

function scanHistoryPointLabel(entry: ScanHistoryEntry): string {
  if (typeof entry.creditedPoints === "number") {
    return entry.creditedPoints > 0 ? `+${entry.creditedPoints}` : "0";
  }
  if (entry.result === "RESERVED" && typeof entry.qrValuePoints === "number") {
    return `QR ${entry.qrValuePoints}`;
  }
  if (["ALREADY_CLAIMED", "EXPIRED", "INVALID", "REPLACED", "PERMISSION_DENIED", "CART_CAP_REACHED"].includes(entry.result)) {
    return "0";
  }
  return "";
}

function scanResultDisplayLabel(result: ScanHistoryEntry["result"], tr: (key: CopyKey) => string): string {
  if (result === "SUCCESS") {
    return tr("success");
  }
  if (result === "RESERVED") {
    return tr("reservedInCart");
  }
  if (result === "ALREADY_CLAIMED") {
    return tr("alreadyScanned");
  }
  if (result === "CART_CAP_REACHED") {
    return tr("cartLimitReached");
  }
  if (result === "EXPIRED") {
    return tr("expiredQr");
  }
  if (result === "INVALID" || result === "REPLACED") {
    return tr("invalidQr");
  }
  if (result === "PERMISSION_DENIED") {
    return tr("permissionDenied");
  }
  return result;
}

function teamMemberSessionId(session: StoredSession): string {
  return session.teamMemberMobile ? `tm-mobile-${session.teamMemberMobile}` : `tm-mobile-${session.contractorId}`;
}

async function copyTextToClipboard(value: string): Promise<boolean> {
  if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }
  return false;
}

function balanceBookTitle(entry: BalanceBookEntry): string {
  if (entry.rewardName) {
    return entry.rewardName;
  }
  return entry.type
    .split("_")
    .map((part) => `${part.charAt(0)}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

const webFileInputStyle = {
  backgroundColor: "#FFFFFF",
  border: `1px solid ${theme.colors.line}`,
  borderRadius: 10,
  boxSizing: "border-box",
  color: theme.colors.ink,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 700,
  minHeight: 48,
  padding: "12px",
  width: "100%",
};

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
    backgroundColor: theme.colors.background,
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
    backgroundColor: theme.colors.background,
    minWidth: 0,
    width: "100%",
  },
  app: {
    flex: 1,
    backgroundColor: theme.colors.background,
    minWidth: 0,
    width: "100%",
  },
  noPointerEvents: {
    pointerEvents: "none",
  },
  header: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderBottomColor: theme.colors.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 58,
    paddingBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xs,
  },
  brandRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: theme.spacing.sm,
    minWidth: 0,
  },
  brandBolt: {
    alignItems: "center",
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    borderWidth: 2,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  brandBoltText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: "900",
  },
  headerCopy: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  headerTitle: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22,
  },
  headerSubtitle: {
    color: theme.colors.muted,
    fontSize: theme.typography.small,
    lineHeight: 18,
    marginTop: theme.spacing.xs,
  },
  languageButton: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.lineStrong,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 32,
    paddingHorizontal: theme.spacing.sm,
  },
  languageText: {
    color: theme.colors.muted,
    fontSize: theme.typography.caption,
    fontWeight: "800",
  },
  languageTextActive: {
    color: theme.colors.primary,
  },
  languageDivider: {
    color: theme.colors.lineStrong,
    marginHorizontal: theme.spacing.xs,
  },
  scrollContent: {
    paddingBottom: 118,
    paddingTop: theme.spacing.md,
  },
  stackScrollContent: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  screenContentInset: {
    gap: 10,
    marginHorizontal: theme.spacing.md,
  },
  navTabBar: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.line,
    minHeight: 74,
    paddingBottom: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  navTabLabel: {
    fontSize: theme.typography.caption,
    fontWeight: "800",
  },
  navTabIcon: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: theme.radius.pill,
    height: 32,
    justifyContent: "center",
    width: 48,
  },
  navTabIconActive: {
    backgroundColor: theme.colors.primarySoft,
  },
  navTabIconText: {
    color: theme.colors.muted,
    fontSize: theme.typography.caption,
    fontWeight: "900",
  },
  navTabIconTextActive: {
    color: theme.colors.primary,
  },
  tabGlyphLine: {
    borderColor: theme.colors.muted,
    backgroundColor: theme.colors.muted,
  },
  tabGlyphLineActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  tabGlyphHomeRoof: {
    borderBottomColor: theme.colors.muted,
    borderBottomWidth: 9,
    borderLeftColor: "transparent",
    borderLeftWidth: 12,
    borderRightColor: "transparent",
    borderRightWidth: 12,
    height: 0,
    marginBottom: 2,
    width: 0,
  },
  tabGlyphHomeRoofActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabGlyphHomeBody: {
    borderRadius: 3,
    height: 12,
    width: 22,
  },
  tabGlyphGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    height: 23,
    width: 23,
  },
  tabGlyphQrCell: {
    borderColor: theme.colors.muted,
    borderRadius: 2,
    borderWidth: 2,
    height: 10,
    width: 10,
  },
  tabGlyphQrCellActive: {
    borderColor: theme.colors.primary,
  },
  tabGlyphClock: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  tabGlyphClockHandVertical: {
    borderRadius: theme.radius.pill,
    height: 8,
    position: "absolute",
    top: 5,
    width: 2,
  },
  tabGlyphClockHandHorizontal: {
    borderRadius: theme.radius.pill,
    height: 2,
    position: "absolute",
    right: 5,
    top: 11,
    width: 8,
  },
  tabGlyphGiftLid: {
    backgroundColor: "transparent",
    borderRadius: 3,
    borderWidth: 2,
    height: 7,
    width: 24,
  },
  tabGlyphGiftBox: {
    backgroundColor: "transparent",
    borderRadius: 3,
    borderTopWidth: 0,
    borderWidth: 2,
    height: 16,
    justifyContent: "center",
    marginTop: 1,
    width: 22,
  },
  tabGlyphGiftRibbon: {
    alignSelf: "center",
    backgroundColor: theme.colors.muted,
    height: "100%",
    width: 3,
  },
  tabGlyphRibbonActive: {
    alignSelf: "center",
    backgroundColor: theme.colors.primary,
    height: "100%",
    width: 3,
  },
  homeGreeting: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    ...theme.shadow,
  },
  greetingCopy: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  greetingTitle: {
    color: theme.colors.ink,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 25,
  },
  tierPill: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.warningSoft,
    borderRadius: theme.radius.pill,
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  tierPillText: {
    color: theme.colors.secondaryDark,
    fontSize: theme.typography.caption,
    fontWeight: "900",
  },
  promoBanner: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    overflow: "hidden",
    padding: theme.spacing.md,
    ...theme.shadow,
  },
  promoBannerCompact: {
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  promoImage: {
    borderRadius: theme.radius.md,
    height: 118,
    width: "100%",
  },
  promoImageCompact: {
    height: 84,
  },
  promoCopyBlock: {
    gap: theme.spacing.xs,
  },
  promoTitle: {
    color: theme.colors.ink,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 24,
  },
  promoBody: {
    color: theme.colors.muted,
    fontSize: theme.typography.small,
    fontWeight: "800",
    lineHeight: 20,
  },
  dashboardMetricGrid: {
    flexDirection: "row",
    gap: 10,
  },
  pointsCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flex: 1,
    minHeight: 112,
    padding: 12,
    ...theme.shadow,
  },
  metricCardLabel: {
    color: theme.colors.muted,
    fontSize: theme.typography.caption,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  pointsValue: {
    color: theme.colors.primary,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 14,
  },
  metricCardValue: {
    color: theme.colors.ink,
    fontSize: 22,
    fontWeight: "900",
    marginTop: theme.spacing.md,
  },
  scanHeroCard: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-start",
    minHeight: 106,
    padding: 16,
    ...theme.shadow,
  },
  scanHeroIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: theme.radius.xl,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  scanHeroCopy: {
    flex: 1,
    minWidth: 0,
  },
  scanHeroTitle: {
    color: theme.colors.surface,
    fontSize: 20,
    fontWeight: "900",
  },
  scanHeroSubtitle: {
    color: "#C7EEF1",
    fontSize: theme.typography.caption,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 4,
  },
  shortcutGrid: {
    flexDirection: "row",
    gap: 10,
  },
  selectedSiteStrip: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: "#BFE7EA",
    borderLeftColor: theme.colors.primary,
    borderLeftWidth: 4,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: 12,
  },
  selectedSiteTitle: {
    color: theme.colors.ink,
    fontSize: theme.typography.body,
    fontWeight: "900",
    lineHeight: 21,
  },
  sectionHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing.sm,
  },
  inlineLink: {
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    fontWeight: "900",
  },
  featuredRewardRail: {
    gap: 10,
    paddingBottom: theme.spacing.sm,
  },
  dashboardHero: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  dashboardHeroCopy: {
    gap: theme.spacing.xs,
  },
  dashboardHeroTitle: {
    color: theme.colors.surface,
    fontSize: theme.typography.heading,
    fontWeight: "900",
    lineHeight: 25,
  },
  dashboardHeroText: {
    color: "#C7EEF1",
    fontSize: theme.typography.small,
    lineHeight: 19,
  },
  dashboardRows: {
    gap: theme.spacing.sm,
  },
  dashboardRow: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  profileHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  profilePhotoPanel: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  profilePhotoHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: theme.spacing.md,
    justifyContent: "space-between",
  },
  avatarLarge: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    height: 64,
    justifyContent: "center",
    overflow: "hidden",
    width: 64,
  },
  fullWidthLogout: {
    alignItems: "center",
    backgroundColor: "#FFF1F1",
    borderColor: "#FFD5D5",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  teamLanding: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  teamSiteBox: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  authIntro: {
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.lg,
  },
  authMark: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.xl,
    height: 70,
    justifyContent: "center",
    width: 70,
  },
  authMarkText: {
    color: theme.colors.surface,
    fontSize: 19,
    fontWeight: "900",
  },
  authIntroTitle: {
    color: theme.colors.primary,
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 24,
    paddingHorizontal: 10,
    textAlign: "center",
    width: "100%",
  },
  authIntroSubtitle: {
    color: theme.colors.muted,
    fontSize: theme.typography.small,
    lineHeight: 19,
    textAlign: "center",
  },
  roleCards: {
    gap: 10,
  },
  roleCard: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
    ...theme.shadow,
  },
  roleCardActive: {
    borderColor: theme.colors.primary,
  },
  roleIcon: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.sm,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  roleIconText: {
    color: theme.colors.primary,
    fontWeight: "900",
  },
  roleGlyph: {
    backgroundColor: theme.colors.muted,
    borderColor: theme.colors.muted,
  },
  roleGlyphActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  roleGlyphBox: {
    alignItems: "center",
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  roleGlyphLarge: {
    transform: [{ scale: 1.25 }],
  },
  roleGlyphPersonHead: {
    borderRadius: theme.radius.pill,
    height: 12,
    width: 12,
  },
  roleGlyphPersonBody: {
    borderTopLeftRadius: theme.radius.pill,
    borderTopRightRadius: theme.radius.pill,
    height: 14,
    marginTop: 3,
    width: 24,
  },
  roleGlyphBadge: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    bottom: 3,
    height: 10,
    position: "absolute",
    right: 4,
    width: 10,
  },
  roleGlyphBadgeActive: {
    backgroundColor: theme.colors.secondary,
  },
  roleGlyphQrFrame: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 4,
    borderWidth: 2,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  roleGlyphQrCell: {
    backgroundColor: "transparent",
    borderRadius: 1,
    borderWidth: 1,
    height: 7,
    width: 7,
  },
  roleCopy: {
    flex: 1,
    minWidth: 0,
  },
  roleTitle: {
    color: theme.colors.ink,
    fontSize: 17,
    fontWeight: "900",
  },
  roleBody: {
    color: theme.colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: theme.spacing.xs,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.warningSoft,
    borderRadius: theme.radius.xs,
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  roleBadgeText: {
    color: theme.colors.secondaryDark,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
    ...theme.shadow,
  },
  panelTitle: {
    color: theme.colors.ink,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 12,
    textAlign: "left",
  },
  panelLead: {
    color: theme.colors.muted,
    fontSize: theme.typography.body,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
    textAlign: "center",
  },
  field: {
    marginBottom: theme.spacing.md,
    position: "relative",
  },
  fieldLabel: {
    color: theme.colors.ink,
    fontSize: theme.typography.small,
    fontWeight: "900",
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.lineStrong,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colors.ink,
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  secureInputWrap: {
    position: "relative",
  },
  secureInput: {
    paddingRight: 76,
  },
  secureRevealButton: {
    alignItems: "center",
    bottom: 8,
    justifyContent: "center",
    minHeight: 38,
    minWidth: 64,
    paddingHorizontal: 8,
    position: "absolute",
    right: 8,
    top: 8,
  },
  secureRevealText: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: "900",
  },
  phoneInput: {
    paddingLeft: 58,
  },
  pinInput: {
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  pinWrap: {
    minHeight: 62,
    position: "relative",
  },
  pinHiddenInput: {
    bottom: 0,
    color: "transparent",
    left: 0,
    opacity: 0.02,
    position: "absolute",
    right: 0,
    top: 0,
  },
  pinBoxes: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pinBox: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.lineStrong,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexGrow: 0,
    flexShrink: 0,
    height: 58,
    justifyContent: "center",
    minWidth: 0,
    width: "23%",
  },
  pinBoxActive: {
    borderColor: theme.colors.primary,
  },
  pinBoxText: {
    color: theme.colors.ink,
    fontSize: 26,
    fontWeight: "900",
  },
  pinRevealButton: {
    alignItems: "center",
    alignSelf: "flex-end",
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  pinRevealText: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: "900",
  },
  phonePrefix: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceMuted,
    borderRightColor: theme.colors.line,
    borderRightWidth: 1,
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    top: 23,
    width: 48,
  },
  phonePrefixText: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: "900",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    justifyContent: "center",
    marginTop: theme.spacing.sm,
    minHeight: 54,
    paddingHorizontal: theme.spacing.lg,
    ...theme.shadow,
  },
  disabledButton: {
    backgroundColor: theme.colors.lineStrong,
  },
  disabledSecondaryButton: {
    borderColor: theme.colors.lineStrong,
    opacity: 0.56,
  },
  primaryButtonText: {
    color: theme.colors.surface,
    fontSize: theme.typography.body,
    fontWeight: "900",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.76,
  },
  linkButton: {
    paddingVertical: theme.spacing.md,
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: "800",
    textAlign: "center",
  },
  helperText: {
    color: theme.colors.muted,
    fontSize: theme.typography.body,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  mutedText: {
    color: theme.colors.muted,
    fontSize: theme.typography.caption,
    lineHeight: 18,
  },
  trustPanel: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  trustIcon: {
    alignItems: "center",
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  trustIconText: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: "900",
  },
  trustCopy: {
    flex: 1,
  },
  trustTitle: {
    color: theme.colors.primary,
    fontWeight: "900",
  },
  trustBody: {
    color: theme.colors.muted,
    fontSize: theme.typography.small,
    lineHeight: 18,
    marginTop: theme.spacing.xs,
  },
  rewardStack: {
    gap: 10,
    paddingBottom: 92,
  },
  pageTitle: {
    color: theme.colors.ink,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: theme.spacing.sm,
  },
  rewardTabsShell: {
    marginBottom: 8,
  },
  rewardTabs: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    padding: 4,
  },
  rewardTab: {
    alignItems: "center",
    borderRadius: theme.radius.pill,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 12,
  },
  rewardTabActive: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 12,
  },
  rewardTabText: {
    color: theme.colors.ink,
    fontSize: theme.typography.caption,
    fontWeight: "900",
  },
  rewardTabTextActive: {
    color: theme.colors.surface,
    fontSize: theme.typography.caption,
    fontWeight: "900",
  },
  bigBalanceCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: 14,
    ...theme.shadow,
  },
  balanceHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bigBalanceValue: {
    color: theme.colors.primary,
    fontSize: 32,
    fontWeight: "900",
    marginVertical: 10,
  },
  rewardStatGrid: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  rewardStatCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flex: 1,
    padding: theme.spacing.md,
  },
  rewardUtilityRow: {
    alignItems: "flex-start",
  },
  statValue: {
    color: theme.colors.ink,
    fontSize: theme.typography.heading,
    fontWeight: "900",
    marginTop: theme.spacing.xs,
  },
  rewardBalanceCard: {
    gap: theme.spacing.sm,
  },
  rewardModeRow: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: theme.spacing.md,
    padding: theme.spacing.xs,
  },
  rewardTile: {
    alignItems: "stretch",
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: 10,
    padding: 12,
    ...theme.shadow,
  },
  rewardTileCompact: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    minHeight: 286,
    padding: theme.spacing.md,
    width: 206,
    ...theme.shadow,
  },
  rewardTileSelected: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  rewardImageTileFrame: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.sm,
    flexShrink: 0,
    height: 118,
    overflow: "hidden",
    width: 104,
  },
  rewardImageCompactFrame: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.sm,
    height: 118,
    overflow: "hidden",
    width: "100%",
  },
  rewardImageTile: {
    height: "100%",
    width: "100%",
  },
  rewardImageDetailFrame: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.md,
    height: 178,
    overflow: "hidden",
    width: "100%",
  },
  rewardImageDetail: {
    height: "100%",
    width: "100%",
  },
  rewardImageFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  rewardImageFallbackText: {
    color: theme.colors.primary,
    fontSize: theme.typography.heading,
    fontWeight: "900",
  },
  rewardIllustrationFrame: {
    alignItems: "center",
    gap: theme.spacing.sm,
    justifyContent: "center",
    padding: theme.spacing.sm,
  },
  rewardIllustrationBody: {
    alignItems: "center",
    borderRadius: theme.radius.lg,
    height: 58,
    justifyContent: "center",
    width: "74%",
  },
  rewardIllustrationHandle: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: theme.radius.pill,
    height: 6,
    marginBottom: theme.spacing.xs,
    width: "44%",
  },
  rewardIllustrationCode: {
    fontSize: 20,
    fontWeight: "900",
  },
  rewardIllustrationLabel: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.caption,
    fontWeight: "900",
  },
  rewardIcon: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  rewardIconText: {
    color: theme.colors.surface,
    fontSize: theme.typography.caption,
    fontWeight: "900",
  },
  rewardTileMain: {
    flex: 1,
    gap: theme.spacing.sm,
    minWidth: 0,
  },
  rewardTileHeader: {
    alignItems: "flex-start",
    flexDirection: "column",
    gap: theme.spacing.sm,
    justifyContent: "space-between",
  },
  rewardTileTitle: {
    color: theme.colors.ink,
    fontSize: theme.typography.body,
    fontWeight: "900",
    lineHeight: 20,
  },
  rewardTileMetaGrid: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  rewardTileMetaBox: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    flex: 1,
    minWidth: 0,
    padding: theme.spacing.sm,
  },
  rewardTileMetaValue: {
    color: theme.colors.ink,
    fontSize: theme.typography.caption,
    fontWeight: "900",
  },
  progressTrack: {
    backgroundColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    height: 7,
    marginTop: theme.spacing.sm,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radius.pill,
    height: "100%",
  },
  rewardGap: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: "800",
  },
  rewardMetaLine: {
    color: theme.colors.primaryDark,
    fontSize: 12,
    fontWeight: "800",
    marginTop: theme.spacing.xs,
  },
  rewardDetail: {
    gap: theme.spacing.md,
  },
  successNotice: {
    backgroundColor: "#E7F7EF",
    borderColor: "#9BD8B7",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: "#075E32",
    fontWeight: "800",
    padding: theme.spacing.md,
  },
  rewardDetailTop: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  rewardDetailIcon: {
    alignItems: "center",
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radius.md,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  rewardDetailIconText: {
    color: theme.colors.ink,
    fontSize: theme.typography.body,
    fontWeight: "900",
  },
  rewardDetailCopy: {
    flex: 1,
    minWidth: 0,
  },
  rewardMetaRow: {
    gap: theme.spacing.sm,
  },
  claimText: {
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    fontWeight: "900",
    marginTop: theme.spacing.sm,
  },
  rewardFilters: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  filterChip: {
    alignItems: "center",
    borderColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: theme.spacing.md,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    color: theme.colors.muted,
    fontSize: theme.typography.caption,
    fontWeight: "800",
  },
  filterChipTextActive: {
    color: theme.colors.surface,
  },
  overline: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    fontWeight: "900",
    marginBottom: theme.spacing.xs,
    textTransform: "uppercase",
  },
  recentCard: {
    backgroundColor: "#FFF8F0",
    borderColor: theme.colors.line,
    borderLeftColor: theme.colors.secondary,
    borderLeftWidth: 4,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  recentActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  clearButton: {
    alignItems: "center",
    borderColor: theme.colors.danger,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
  },
  clearButtonText: {
    color: theme.colors.danger,
    fontWeight: "800",
  },
  devOtp: {
    backgroundColor: "#FFF3E5",
    borderColor: "#FFD2A3",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    marginVertical: theme.spacing.md,
    padding: theme.spacing.md,
  },
  devOtpText: {
    color: theme.colors.secondaryDark,
    fontWeight: "800",
  },
  cameraOnlyNotice: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
  },
  cameraOnlyText: {
    color: theme.colors.muted,
    fontSize: theme.typography.small,
    fontWeight: "700",
    lineHeight: 19,
    textAlign: "center",
  },
  summary: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  summaryTop: {
    flexDirection: "row",
    gap: theme.spacing.md,
    justifyContent: "space-between",
  },
  identityRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radius.md,
    height: 52,
    justifyContent: "center",
    overflow: "hidden",
    width: 52,
  },
  avatarText: {
    color: theme.colors.ink,
    fontSize: theme.typography.body,
    fontWeight: "900",
  },
  identityCopy: {
    flex: 1,
  },
  summaryName: {
    color: theme.colors.ink,
    fontSize: theme.typography.heading,
    fontWeight: "900",
    lineHeight: 23,
  },
  summaryMobile: {
    color: theme.colors.muted,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    marginTop: theme.spacing.xs,
  },
  logoutButton: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.dangerSoft,
    borderColor: "#F3BBBB",
    borderRadius: theme.radius.xs,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  logoutText: {
    color: theme.colors.danger,
    fontWeight: "800",
  },
  metricRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  metric: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flex: 1,
    padding: theme.spacing.md,
  },
  metricEmphasis: {
    backgroundColor: theme.colors.surface,
  },
  metricValue: {
    color: "#DDF6F8",
    fontSize: theme.typography.heading,
    fontWeight: "900",
  },
  metricValueEmphasis: {
    color: theme.colors.primary,
  },
  metricLabel: {
    color: "#C7EEF1",
    fontSize: theme.typography.caption,
    marginTop: theme.spacing.xs,
  },
  metricLabelEmphasis: {
    color: theme.colors.muted,
  },
  quickActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  quickAction: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flex: 1,
    minHeight: 126,
    padding: theme.spacing.md,
  },
  quickActionPrimary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  quickIcon: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.sm,
    height: 30,
    justifyContent: "center",
    marginBottom: theme.spacing.md,
    width: 36,
  },
  quickIconPrimary: {
    backgroundColor: theme.colors.secondary,
  },
  quickClockFace: {
    alignItems: "center",
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    height: 17,
    justifyContent: "center",
    width: 17,
  },
  quickIconLine: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: 2,
    width: 10,
  },
  quickIconLinePrimary: {
    backgroundColor: theme.colors.ink,
    borderRadius: theme.radius.pill,
    height: 2,
    width: 10,
  },
  quickClockHand: {
    position: "absolute",
    transform: [{ rotate: "90deg" }, { translateX: 3 }],
    width: 7,
  },
  quickLedgerLine: {
    marginTop: 3,
    width: 14,
  },
  quickLedgerLineWide: {
    marginTop: 3,
    width: 20,
  },
  quickTitle: {
    color: theme.colors.ink,
    fontSize: theme.typography.body,
    fontWeight: "900",
    lineHeight: 19,
  },
  quickTitlePrimary: {
    color: theme.colors.surface,
  },
  quickCaption: {
    color: theme.colors.muted,
    fontSize: theme.typography.caption,
    lineHeight: 17,
    marginTop: theme.spacing.sm,
  },
  quickCaptionPrimary: {
    color: "#C7EEF1",
  },
  sectionTitle: {
    color: theme.colors.ink,
    fontSize: theme.typography.body,
    fontWeight: "900",
    marginBottom: theme.spacing.sm,
  },
  selectedSitePanel: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: "#BFE7EA",
    borderLeftColor: theme.colors.primary,
    borderLeftWidth: 4,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    marginVertical: theme.spacing.md,
    padding: theme.spacing.md,
  },
  scanningForCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  scanIdentityLabel: {
    color: "#BFE7EA",
    fontSize: theme.typography.caption,
    fontWeight: "900",
    marginBottom: theme.spacing.xs,
    textTransform: "uppercase",
  },
  scanIdentityName: {
    color: theme.colors.surface,
    fontSize: theme.typography.body,
    fontWeight: "900",
  },
  scanIdentityMeta: {
    color: "#DDF6F8",
    fontSize: theme.typography.caption,
    lineHeight: 18,
    marginTop: theme.spacing.xs,
  },
  scanTargetCard: {
    alignItems: "center",
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderStyle: "dashed",
    borderWidth: 1,
    justifyContent: "center",
    marginBottom: theme.spacing.md,
    minHeight: 220,
    padding: theme.spacing.lg,
  },
  scanTargetInner: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 190,
    padding: theme.spacing.lg,
    width: "100%",
  },
  scanTargetIcon: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.xl,
    height: 80,
    justifyContent: "center",
    width: 80,
  },
  scanTargetIconText: {
    color: theme.colors.surface,
    fontSize: 23,
    fontWeight: "900",
  },
  scanTargetTitle: {
    color: theme.colors.primary,
    fontSize: theme.typography.body,
    fontWeight: "900",
    marginTop: theme.spacing.md,
  },
  scanCartCard: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.lineStrong,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
  },
  scanCartHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: theme.spacing.md,
    justifyContent: "space-between",
  },
  cartGuardCard: {
    backgroundColor: theme.colors.warningSoft,
    borderColor: theme.colors.warning,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  cartCommitSuccessCard: {
    backgroundColor: theme.colors.successSoft,
    borderColor: theme.colors.success,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  teamNoSiteCard: {
    backgroundColor: theme.colors.warningSoft,
    borderColor: theme.colors.warning,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  scanCartMetricRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  scanCartCapacity: {
    gap: theme.spacing.sm,
  },
  scanCartCapacityHeader: {
    flexDirection: "row",
    gap: theme.spacing.md,
    justifyContent: "space-between",
  },
  scanCartProgressTrack: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.pill,
    height: 8,
    overflow: "hidden",
  },
  scanCartProgressFill: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radius.pill,
    height: 8,
  },
  scanCartItemCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  scanCartItemTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: theme.spacing.md,
    justifyContent: "space-between",
  },
  scanCartItemCopy: {
    flex: 1,
    minWidth: 0,
  },
  copyValueRow: {
    alignItems: "center",
    borderColor: theme.colors.line,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.sm,
    justifyContent: "space-between",
    paddingTop: theme.spacing.sm,
  },
  copyValueText: {
    flex: 1,
    minWidth: 0,
  },
  copyValue: {
    color: theme.colors.ink,
    fontSize: theme.typography.caption,
    fontWeight: "800",
    lineHeight: 18,
  },
  scanResultPanel: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    ...theme.shadow,
  },
  resultIconSuccess: {
    alignItems: "center",
    backgroundColor: theme.colors.successSoft,
    borderRadius: theme.radius.xl,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  resultIconText: {
    color: theme.colors.success,
    fontSize: 30,
    fontWeight: "900",
  },
  resultIconDanger: {
    alignItems: "center",
    backgroundColor: theme.colors.dangerSoft,
    borderRadius: theme.radius.xl,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  resultIconDangerText: {
    color: theme.colors.danger,
    fontSize: 30,
    fontWeight: "900",
  },
  resultIconWarning: {
    alignItems: "center",
    backgroundColor: theme.colors.warningSoft,
    borderRadius: theme.radius.xl,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  resultIconWarningText: {
    color: theme.colors.warning,
    fontSize: 30,
    fontWeight: "900",
  },
  resultTitle: {
    color: theme.colors.primary,
    fontSize: theme.typography.heading,
    fontWeight: "900",
    textAlign: "center",
  },
  resultSubtitle: {
    color: theme.colors.muted,
    fontSize: theme.typography.small,
    textAlign: "center",
  },
  resultFailureBody: {
    color: theme.colors.muted,
    fontSize: theme.typography.body,
    lineHeight: 22,
    textAlign: "center",
  },
  resultProductCard: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    width: "100%",
  },
  productThumb: {
    alignItems: "center",
    backgroundColor: theme.colors.primaryDark,
    borderRadius: theme.radius.sm,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  resultProductCopy: {
    flex: 1,
    minWidth: 0,
  },
  pointsDeltaBox: {
    alignItems: "center",
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    minWidth: 82,
    padding: theme.spacing.sm,
  },
  pointsDeltaText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: "900",
  },
  balanceResultCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
    width: "100%",
  },
  balanceResultValue: {
    color: theme.colors.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  cardTitle: {
    color: theme.colors.ink,
    fontSize: theme.typography.body,
    fontWeight: "900",
    lineHeight: 20,
  },
  siteChooser: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  siteChoiceList: {
    gap: theme.spacing.sm,
  },
  siteChoiceRow: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  siteChoiceRowSelected: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  siteChips: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  siteChip: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
  },
  siteChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  siteChipText: {
    color: theme.colors.ink,
    fontWeight: "800",
  },
  siteChipTextSelected: {
    color: theme.colors.surface,
  },
  siteRow: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.line,
    borderLeftColor: theme.colors.primary,
    borderLeftWidth: 4,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  siteRowSelected: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  siteRowMain: {
    marginBottom: theme.spacing.sm,
  },
  siteRowTop: {
    alignItems: "flex-start",
    flexDirection: "column",
    gap: theme.spacing.sm,
  },
  siteDetailHeader: {
    alignItems: "flex-start",
    borderBottomColor: theme.colors.line,
    borderBottomWidth: 1,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  detailHeader: {
    alignItems: "flex-start",
    borderBottomColor: theme.colors.line,
    borderBottomWidth: 1,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  rowActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  archiveButton: {
    borderColor: theme.colors.warning,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
  },
  archiveText: {
    color: theme.colors.secondaryDark,
    fontWeight: "800",
  },
  formBlock: {
    borderTopColor: theme.colors.line,
    borderTopWidth: 1,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  historyRow: {
    alignItems: "flex-start",
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
  },
  balanceBookRow: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
  },
  historyMarker: {
    alignItems: "center",
    backgroundColor: "#EEF1F1",
    borderRadius: theme.radius.sm,
    height: 36,
    justifyContent: "center",
    width: 42,
  },
  historyMarkerSuccess: {
    backgroundColor: theme.colors.primarySoft,
  },
  historyMarkerQrGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
    height: 20,
    width: 20,
  },
  historyMarkerQrCell: {
    borderColor: theme.colors.primary,
    borderRadius: 2,
    borderWidth: 1,
    height: 9,
    width: 9,
  },
  historyMarkerPersonHead: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    height: 9,
    width: 9,
  },
  historyMarkerPersonBody: {
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: theme.radius.pill,
    borderTopRightRadius: theme.radius.pill,
    height: 11,
    marginTop: 2,
    width: 20,
  },
  historyMarkerGlyphActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  historyMain: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  historyRight: {
    alignItems: "flex-end",
    gap: theme.spacing.sm,
    maxWidth: 112,
  },
  historyTitle: {
    color: theme.colors.ink,
    fontSize: theme.typography.body,
    fontWeight: "900",
    lineHeight: 20,
  },
  historyMeta: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: "800",
  },
  historyReference: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  historyPoints: {
    color: theme.colors.success,
    fontSize: theme.typography.body,
    fontWeight: "900",
  },
  historyPointsNegative: {
    color: theme.colors.danger,
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xs,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
  },
  emptyText: {
    color: theme.colors.muted,
    paddingVertical: theme.spacing.xl,
    textAlign: "center",
  },
  infoStrip: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: "#BFE7EA",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  infoText: {
    color: theme.colors.primary,
    fontWeight: "700",
    lineHeight: 21,
  },
  bottomTabs: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    bottom: theme.spacing.md,
    flexDirection: "row",
    left: theme.spacing.md,
    padding: theme.spacing.xs,
    position: "absolute",
    right: theme.spacing.md,
  },
  tabButton: {
    alignItems: "center",
    borderRadius: theme.radius.sm,
    flex: 1,
    gap: 2,
    justifyContent: "center",
    minHeight: 58,
    paddingVertical: theme.spacing.xs,
  },
  tabButtonScan: {
    marginTop: -16,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  tabSymbol: {
    alignItems: "center",
    borderRadius: theme.radius.sm,
    height: 24,
    justifyContent: "center",
    maxHeight: 24,
    minHeight: 24,
    width: 32,
  },
  tabSymbolScan: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.surface,
    borderWidth: 2,
    height: 44,
    maxHeight: 44,
    minHeight: 44,
    width: 44,
  },
  tabSymbolActive: {
    backgroundColor: theme.colors.primary,
  },
  tabSymbolText: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: "900",
  },
  tabSymbolTextScan: {
    color: theme.colors.surface,
  },
  tabSymbolTextActive: {
    color: theme.colors.surface,
  },
  tabText: {
    color: theme.colors.muted,
    fontSize: theme.typography.metadata,
    fontWeight: "900",
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  loadingOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(27, 28, 28, 0.48)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  loadingText: {
    color: theme.colors.surface,
    fontWeight: "800",
    marginTop: theme.spacing.sm,
  },
  toast: {
    borderRadius: theme.radius.md,
    bottom: 92,
    left: theme.spacing.lg,
    padding: theme.spacing.md,
    position: "absolute",
    right: theme.spacing.lg,
  },
  toastSuccess: {
    backgroundColor: theme.colors.success,
  },
  toastDanger: {
    backgroundColor: theme.colors.danger,
  },
  toastText: {
    color: theme.colors.surface,
    fontWeight: "800",
    textAlign: "center",
  },
});
