import { TestUserPanel } from "@/components/TestUserPanel";

const TestUsers = () => {
  // Só mostrar em desenvolvimento
  const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

  if (!isDevelopment) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold text-muted-foreground">Página não disponível em produção</h1>
      </div>
    );
  }

  return (
    <div className="p-4 min-h-screen bg-background">
      <div className="max-w-6xl mx-auto">
        <TestUserPanel />
      </div>
    </div>
  );
};

export default TestUsers;