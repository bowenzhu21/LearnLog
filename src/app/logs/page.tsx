import RelayProvider from "@/relay/RelayProvider";
import LogsView from "./LogsView";

export default function LogsPage() {
  return (
    <div className="p-8">
      <RelayProvider>
        <LogsView />
      </RelayProvider>
    </div>
  );
}
