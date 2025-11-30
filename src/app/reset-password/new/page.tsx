import { AuthShell } from "@/src/components/AuthShell";
import { Button, TextInput } from "@/src/components/ui";

export default function CreateNewPasswordPage() {
  return (
    <AuthShell variant="pattern">
      <div className="flex flex-col gap-6">
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">
            Create new Password
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Set a strong, memorable password to keep your ride account secure.
          </p>
        </header>

        <form className="flex flex-col gap-4">
          <TextInput
            label="New password"
            type="password"
            placeholder="Enter your password"
            required
          />
          <Button type="submit" className="mt-1">
            Confirm
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
