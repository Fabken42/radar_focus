import Link from 'next/link';
import { Target, BarChart3, Clock, Trophy } from 'lucide-react';
import { Header } from '@/components/Header';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <section className="py-20 px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center">
                <Target size={32} className="text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Radar<span className="text-indigo-600 dark:text-indigo-400">Focus</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-8">
              Veja seus pontos fortes e fracos em um único gráfico.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/app"
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold text-lg"
              >
                Começar agora — é grátis
              </Link>
            </div>
            <p className="text-sm text-gray-400 mt-3">Sem cadastro obrigatório. Dados salvos localmente.</p>
          </div>
        </section>

        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10 text-gray-900 dark:text-white">Como funciona</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: Trophy, title: 'Crie tarefas por categoria', desc: 'Estudo, Trabalho, Saúde, Lazer — você define as categorias.' },
                { icon: BarChart3, title: 'Veja seu radar', desc: 'Um gráfico de aranha mostra onde você está equilibrado (e onde não está).' },
                { icon: Clock, title: 'Timer integrado', desc: 'Use o timer por tarefa para gerenciar seu tempo com precisão.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center mb-4">
                    <Icon size={20} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="font-bold mb-2 text-gray-900 dark:text-white">{title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
