import { getCurrentUser } from "../lib/api";
import { AppFrame, EmptyState, LinkButton, PageMain } from "../components/AppPage";

export default function ComingSoonPage({ sectionKey, title }) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "/signin";
    return null;
  }

  return (
    <AppFrame active={sectionKey}>
      <PageMain>
        <div className="site-rise flex min-h-[60dvh] items-center justify-center">
          <EmptyState
            character="student-usman"
            tone="mint"
            title={title}
            body="This section is on its way. Your practice history will show up here."
            action={<LinkButton to="/dashboard">Back to dashboard</LinkButton>}
            className="w-full max-w-lg"
          />
        </div>
      </PageMain>
    </AppFrame>
  );
}
