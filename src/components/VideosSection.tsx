import { useState, useMemo, useEffect } from "react";
import { Video, Upload, Link as LinkIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHubId } from "@/contexts/hub-context";
import {
  useVideos,
  useVideo,
  useUploadVideo,
  useAddVideoLink,
  useUpdateVideo,
  useDeleteVideo,
  useBulkVideoAction,
  useTrackEngagement,
  useToast,
} from "@/hooks";
import {
  VideoCard,
  VideoFilters,
  VideoEmptyState,
  VideoBulkActionsBar,
  RecordVideoDialog,
  UploadVideoDialog,
  AddLinkDialog,
  EditVideoDialog,
} from "./videos";
import type { Video, VideoVisibility, AddVideoLinkRequest, UpdateVideoRequest } from "@/types";

type ViewMode = "grid" | "list";
type SortOption = "newest" | "oldest" | "most-viewed";
const EMPTY_VIDEOS: Video[] = [];

export function VideosSection() {
  const hubId = useHubId();

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | VideoVisibility>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Modal State
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  // Data Hooks
  const { data: videosData, isLoading } = useVideos(hubId);
  const { data: selectedVideo } = useVideo(hubId, selectedVideoId || "");

  // Mutation Hooks
  const { mutate: uploadVideo, isPending: isUploading } = useUploadVideo(hubId);
  const { mutate: addLink, isPending: isAddingLink } = useAddVideoLink(hubId);
  const updateMutation = useUpdateVideo(hubId, selectedVideoId || "");
  const { mutate: deleteVideo, isPending: isDeleting } = useDeleteVideo(hubId);
  const { mutate: bulkAction } = useBulkVideoAction(hubId);

  // Engagement tracking
  const { trackHubViewed } = useTrackEngagement(hubId);
  const { toast } = useToast();

  useEffect(() => {
    trackHubViewed("videos");
  }, [trackHubViewed]);

  const handleStartRecording = () => {
    toast({
      title: "Recording",
      description: "Recording feature requires Microsoft Teams integration. Coming soon!",
    });
    setRecordModalOpen(false);
  };

  const videos = videosData?.items ?? EMPTY_VIDEOS;

  // Filter and sort videos
  const filteredVideos = useMemo(() => {
    let result = [...videos];

    // Filter by visibility
    if (visibilityFilter !== "all") {
      result = result.filter((v) => v.visibility === visibilityFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        case "most-viewed":
          return b.views - a.views;
        default: // newest
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      }
    });

    return result;
  }, [videos, visibilityFilter, sortBy]);

  const toggleVideoSelection = (id: string) => {
    setSelectedVideos((prev) =>
      prev.includes(id) ? prev.filter((vid) => vid !== id) : [...prev, id]
    );
  };

  const handleUpload = (data: { file: File; title: string; description?: string; visibility: VideoVisibility }) => {
    uploadVideo(data, {
      onSuccess: () => setUploadModalOpen(false),
    });
  };

  const handleAddLink = (data: AddVideoLinkRequest) => {
    addLink(data, {
      onSuccess: () => setLinkModalOpen(false),
    });
  };

  const handleUpdateVideo = (data: UpdateVideoRequest) => {
    updateMutation.mutate(data, {
      onSuccess: () => setSelectedVideoId(null),
    });
  };

  const handleDeleteVideo = () => {
    if (!selectedVideoId) return;
    deleteVideo(selectedVideoId, {
      onSuccess: () => setSelectedVideoId(null),
    });
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedVideos.length} videos?`)) {
      bulkAction({ videoIds: selectedVideos, action: "delete" });
      setSelectedVideos([]);
    }
  };

  const handleBulkChangeVisibility = () => {
    bulkAction({ videoIds: selectedVideos, action: "set_visibility", visibility: "internal" });
    setSelectedVideos([]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gradient-blue))]" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-[hsl(var(--royal-blue))]">Videos</h1>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setRecordModalOpen(true)}
              className="bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]/90 text-white"
            >
              <Video className="h-4 w-4" />
              Record Video
            </Button>
            <Button
              onClick={() => setUploadModalOpen(true)}
              className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90 text-white"
            >
              <Upload className="h-4 w-4" />
              Upload Video
            </Button>
            <Button
              variant="outline"
              onClick={() => setLinkModalOpen(true)}
              className="border-[hsl(var(--gradient-blue))] text-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/10"
            >
              <LinkIcon className="h-4 w-4" />
              Add Link
            </Button>
          </div>
        </div>

        {videos.length > 0 ? (
          <>
            <VideoFilters
              visibilityFilter={visibilityFilter}
              onVisibilityChange={setVisibilityFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filteredVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  isSelected={selectedVideos.includes(video.id)}
                  onSelect={toggleVideoSelection}
                  onClick={setSelectedVideoId}
                  viewMode={viewMode}
                />
              ))}
            </div>
          </>
        ) : (
          <VideoEmptyState
            onRecord={() => setRecordModalOpen(true)}
            onUpload={() => setUploadModalOpen(true)}
            onAddLink={() => setLinkModalOpen(true)}
          />
        )}

        <VideoBulkActionsBar
          selectedCount={selectedVideos.length}
          onChangeVisibility={handleBulkChangeVisibility}
          onDelete={handleBulkDelete}
        />

        <RecordVideoDialog
          isOpen={recordModalOpen}
          onClose={() => setRecordModalOpen(false)}
          onStartRecording={handleStartRecording}
        />

        <UploadVideoDialog
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onUpload={handleUpload}
          isUploading={isUploading}
        />

        <AddLinkDialog
          isOpen={linkModalOpen}
          onClose={() => setLinkModalOpen(false)}
          onAdd={handleAddLink}
          isAdding={isAddingLink}
        />

        <EditVideoDialog
          video={selectedVideo || null}
          isOpen={!!selectedVideoId}
          onClose={() => setSelectedVideoId(null)}
          onSave={handleUpdateVideo}
          onDelete={handleDeleteVideo}
          isSaving={updateMutation.isPending}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
}
