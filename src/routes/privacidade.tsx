import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Banho & Tosa da JU" },
      { name: "description", content: "Como tratamos os dados pessoais de clientes e pets, conforme a LGPD." },
    ],
  }),
  component: Privacidade,
});

function Secao({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="font-serif text-xl mb-2">{title}</h2>
      <div className="text-sm text-ink/70 space-y-2 leading-relaxed">{children}</div>
    </div>
  );
}

function Privacidade() {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-6 md:px-8 py-16">
        <p className="text-xs text-ink/40 mb-2">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
        <h1 className="font-serif text-3xl md:text-4xl mb-8">Política de Privacidade</h1>

        <Secao title="1. Quem somos">
          <p>
            O Banho &amp; Tosa da JU ("nós") oferece serviços de banho, tosa e transporte de pets (Taxi Dog).
            Esta política explica quais dados pessoais coletamos através deste site, para que servem e quais
            são os seus direitos, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
          </p>
        </Secao>

        <Secao title="2. Quais dados coletamos">
          <p>Coletamos os seguintes dados quando você cria uma conta e usa o portal do cliente:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Nome e telefone (usados para contato e confirmação de agendamentos via WhatsApp)</li>
            <li>E-mail e senha (usados para login na plataforma)</li>
            <li>Dados dos seus pets: nome, espécie, raça, porte e observações que você cadastrar</li>
            <li>Endereço de coleta/entrega, quando você solicita o serviço de Taxi Dog</li>
            <li>Fotos do seu pet tiradas durante o atendimento, para que você possa visualizá-las no portal</li>
            <li>Dados de pagamento (quando aplicável), processados diretamente pelo provedor de pagamentos — nunca armazenamos número de cartão em nossos servidores</li>
            <li>Histórico de agendamentos e pacotes contratados</li>
          </ul>
        </Secao>

        <Secao title="3. Para que usamos seus dados">
          <ul className="list-disc pl-5 space-y-1">
            <li>Confirmar, lembrar e gerenciar seus agendamentos</li>
            <li>Organizar as rotas do Taxi Dog</li>
            <li>Enviar avisos sobre o saldo do seu pacote mensal</li>
            <li>Mostrar o histórico e as fotos do seu pet no seu portal</li>
            <li>Cumprir obrigações legais e fiscais relacionadas aos pagamentos</li>
          </ul>
        </Secao>

        <Secao title="4. Com quem compartilhamos">
          <p>
            Não vendemos seus dados. Compartilhamos informações apenas com prestadores estritamente necessários
            para o funcionamento do serviço, como o provedor de banco de dados (Supabase) e, quando aplicável,
            o provedor de pagamentos (Stripe). A confirmação de agendamentos é feita via WhatsApp, um serviço de
            terceiros que você já utiliza por sua própria conta.
          </p>
        </Secao>

        <Secao title="5. Seus direitos como titular dos dados">
          <p>De acordo com a LGPD, você pode a qualquer momento solicitar:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Confirmação da existência de tratamento dos seus dados</li>
            <li>Acesso aos seus dados</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados</li>
            <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
            <li>Portabilidade dos dados a outro fornecedor</li>
            <li>Eliminação dos dados tratados com o seu consentimento</li>
            <li>Revogação do consentimento a qualquer momento</li>
          </ul>
          <p>
            Para exercer qualquer um desses direitos, entre em contato pelo WhatsApp{" "}
            <a href="https://wa.me/5511944811381" target="_blank" rel="noreferrer" className="underline text-brand">
              (11) 94481-1381
            </a>.
          </p>
        </Secao>

        <Secao title="6. Retenção e exclusão">
          <p>
            Mantemos seus dados enquanto sua conta estiver ativa ou pelo tempo necessário para cumprir obrigações
            legais (como registros fiscais de pagamentos). Você pode solicitar a exclusão da sua conta e dos seus
            dados a qualquer momento, ressalvado o que a lei exigir que seja mantido.
          </p>
        </Secao>

        <Secao title="7. Segurança">
          <p>
            Utilizamos controles de acesso por perfil (cliente, funcionário, administrador) e conexão criptografada
            (HTTPS) para proteger seus dados. O acesso às suas informações é restrito à equipe autorizada do
            Banho &amp; Tosa da JU.
          </p>
        </Secao>

        <Secao title="8. Alterações desta política">
          <p>
            Podemos atualizar esta política periodicamente. Mudanças relevantes serão comunicadas através deste site.
          </p>
        </Secao>

        <Link to="/" className="inline-block mt-4 text-sm text-brand font-bold hover:underline">
          ← Voltar ao início
        </Link>
      </div>
      <SiteFooter />
    </div>
  );
}
