import RelayProvider from "@/relay/RelayProvider";
import LogsView from "./LogsView";

export const dynamic = "force-dynamic";

export default function LogsPage() {
  return (
    <div className="p-8">
      <RelayProvider>
        <LogsView />
      </RelayProvider>
    </div>
  );
}
