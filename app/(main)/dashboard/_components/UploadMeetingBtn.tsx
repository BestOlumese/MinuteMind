import { CreateMeetingModal } from "@/components/modals/create-meeting-modal";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export default function UploadMeetingBtn() {
  return (
    <div>
      <CreateMeetingModal>
        <Button size="lg">
          <Upload className="w-4 h-4" />
          Upload New Meeting
        </Button>
      </CreateMeetingModal>
    </div>
  );
}
