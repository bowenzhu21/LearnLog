import RelayProvider from "@/relay/RelayProvider";
import LogsView from "./LogsView";

export default function LogsPage() {
  return (
    <RelayProvider>
      <LogsView />
    </RelayProvider>
  );
}
