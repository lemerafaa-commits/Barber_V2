import React, { useState, useEffect } from 'react';
import {
  MasterTab,
  PlatformMetrics,
  MasterBusiness,
  MasterUser,
  MasterAppointment,
  MasterSubscription,
  MasterActivityItem,
  ChartDataPoint,
  RetentionMetrics,
  MonthlyCohortDataPoint,
  AppointmentStatus,
} from '../../types/master';
import { masterDataService } from '../../services/master/masterDataService';
import { MasterSidebar } from './MasterSidebar';
import { MasterHeader } from './MasterHeader';
import { MasterOverview } from './MasterOverview';
import { MasterNetwork } from './MasterNetwork';
import { MasterAppointments } from './MasterAppointments';
import { MasterSubscriptions } from './MasterSubscriptions';
import { MasterReports } from './MasterReports';
import { MasterSettings } from './MasterSettings';
import { MasterProfile } from './MasterProfile';
import { Loader2, LogOut, X, ExternalLink } from 'lucide-react';

interface MasterDashboardProps {
  onNavigateHome: () => void;
  onNavigateAdmin: () => void;
}

export const MasterDashboard: React.FC<MasterDashboardProps> = ({
  onNavigateHome,
  onNavigateAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<MasterTab>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Asynchronous state loaded via MasterDataService
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [retentionMetrics, setRetentionMetrics] = useState<RetentionMetrics | null>(null);
  const [cohorts, setCohorts] = useState<MonthlyCohortDataPoint[]>([]);
  const [businesses, setBusinesses] = useState<MasterBusiness[]>([]);
  const [users, setUsers] = useState<MasterUser[]>([]);
  const [appointments, setAppointments] = useState<MasterAppointment[]>([]);
  const [subscriptions, setSubscriptions] = useState<MasterSubscription[]>([]);
  const [activities, setActivities] = useState<MasterActivityItem[]>([]);
  const [growthChart, setGrowthChart] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    async function loadMasterData() {
      try {
        setIsLoading(true);
        const [
          fetchedMetrics,
          fetchedRetention,
          fetchedCohorts,
          fetchedBusinesses,
          fetchedUsers,
          fetchedAppointments,
          fetchedSubscriptions,
          fetchedActivities,
          fetchedChart,
        ] = await Promise.all([
          masterDataService.getPlatformMetrics(),
          masterDataService.getRetentionMetrics(),
          masterDataService.getMonthlyCohorts(),
          masterDataService.getBusinesses(),
          masterDataService.getUsers(),
          masterDataService.getAppointments(),
          masterDataService.getSubscriptions(),
          masterDataService.getRecentActivities(),
          masterDataService.getGrowthChart(),
        ]);

        setMetrics(fetchedMetrics);
        setRetentionMetrics(fetchedRetention);
        setCohorts(fetchedCohorts);
        setBusinesses(fetchedBusinesses);
        setUsers(fetchedUsers);
        setAppointments(fetchedAppointments);
        setSubscriptions(fetchedSubscriptions);
        setActivities(fetchedActivities);
        setGrowthChart(fetchedChart);
      } catch (err) {
        console.error('Erro ao carregar dados do Master Dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadMasterData();
  }, []);

  const handleUpdateAppointmentStatus = async (
    appointmentId: string,
    newStatus: AppointmentStatus,
    reason: string
  ) => {
    try {
      const updated = await masterDataService.updateAppointmentStatus(
        appointmentId,
        newStatus,
        reason,
        'Rafael Leme (Master)'
      );

      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointmentId ? updated : apt))
      );
    } catch (err) {
      console.error('Erro ao atualizar agendamento no Master:', err);
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* 1. Master Navigation Sidebar */}
      <MasterSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onLogoutClick={() => setIsLogoutModalOpen(true)}
        onNavigateHome={onNavigateHome}
        onNavigateAdmin={onNavigateAdmin}
      />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all">
        {/* Top Header */}
        <MasterHeader
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigateHome={onNavigateHome}
          onNavigateAdmin={onNavigateAdmin}
          onSelectTab={setActiveTab}
        />

        {/* Page Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {isLoading || !metrics ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="text-xs text-zinc-400 font-medium">
                Carregando centro de controle da plataforma...
              </span>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <MasterOverview
                  metrics={metrics}
                  activities={activities}
                  growthChart={growthChart}
                  onSelectTab={setActiveTab}
                />
              )}

              {/* GESTÃO DA REDE (Unificando Barbearias e Usuários) */}
              {(activeTab === 'network' || activeTab === 'businesses' || activeTab === 'users') && (
                <MasterNetwork
                  businesses={businesses}
                  users={users}
                  defaultSubTab={activeTab === 'users' ? 'users' : 'businesses'}
                />
              )}

              {/* AGENDAMENTOS (Com controle e auditoria administrativa de status) */}
              {activeTab === 'appointments' && (
                <MasterAppointments
                  appointments={appointments}
                  onUpdateStatus={handleUpdateAppointmentStatus}
                />
              )}

              {activeTab === 'subscriptions' && (
                <MasterSubscriptions subscriptions={subscriptions} />
              )}

              {/* RELATÓRIOS (Com Retenção, Churn e Coortes Mês a Mês) */}
              {activeTab === 'reports' && (
                <MasterReports
                  growthChart={growthChart}
                  retentionMetrics={retentionMetrics || undefined}
                  cohorts={cohorts}
                  businesses={businesses}
                />
              )}

              {activeTab === 'settings' && <MasterSettings />}

              {activeTab === 'profile' && (
                <MasterProfile
                  onLogoutClick={() => setIsLogoutModalOpen(true)}
                  onNavigateAdmin={onNavigateAdmin}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* 3. Visual Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            onClick={() => setIsLogoutModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl z-10 space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <LogOut className="w-5 h-5 text-rose-400" />
                Sair do Master Dashboard
              </h3>
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Nesta etapa de prototipação UI/UX, o logout real não é obrigatório.
              Para onde deseja navegar?
            </p>

            <div className="space-y-2 pt-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  onNavigateHome();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium flex items-center justify-between transition-colors"
              >
                <span>Ir para a Página Pública de Agendamento (/)</span>
                <ExternalLink className="w-4 h-4 text-emerald-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  onNavigateAdmin();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium flex items-center justify-between transition-colors"
              >
                <span>Ir para o Painel da Barbearia (/admin)</span>
                <ExternalLink className="w-4 h-4 text-amber-400" />
              </button>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800"
              >
                Permanecer no Master
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
