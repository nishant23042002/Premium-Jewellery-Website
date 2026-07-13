import { Loader } from "@/components/common/loader";

export default function RootLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader />
    </div>
  );
}
