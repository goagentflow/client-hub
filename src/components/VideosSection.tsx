import { useState } from "react";
import { Video, Upload, Link as LinkIcon, Play, Eye, EyeOff, MoreVertical, Grid3x3, List, Filter, Tag as TagIcon, Trash2, Edit, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

type ViewMode = "grid" | "list";

const mockVideos = [
  {
    id: 1,
    title: "Welcome to Your Proposal",
    description: "Hamish introduces AgentFlow and walks through the key benefits and timeline for Client Example123...",
    duration: "2:34",
    tags: ["Intro"],
    visibility: "client",
    views: 3,
    date: "Nov 22",
    thumbnail: "placeholder",
  },
  {
    id: 2,
    title: "Solution Walkthrough",
    description: "A detailed look at how AgentFlow will transform your workflow and increase efficiency...",
    duration: "8:15",
    tags: ["Walkthrough"],
    visibility: "client",
    views: 2,
    date: "Nov 21",
    thumbnail: "placeholder",
  },
  {
    id: 3,
    title: "Similar Project Case Study",
    description: "See how we helped a similar company achieve 40% faster response times...",
    duration: "4:52",
    tags: ["Case Study"],
    visibility: "client",
    views: 0,
    date: "Nov 20",
    thumbnail: "placeholder",
  },
  {
    id: 4,
    title: "Draft intro - needs re-recording",
    description: "Initial recording with some audio issues, keeping for reference...",
    duration: "1:20",
    tags: ["Intro", "Draft"],
    visibility: "internal",
    views: 0,
    date: "Nov 19",
    thumbnail: "placeholder",
  },
];

export function VideosSection() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedVideos, setSelectedVideos] = useState<number[]>([]);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [editVideoId, setEditVideoId] = useState<number | null>(null);
  const [hasVideos] = useState(true); // Set to false to see empty state

  const selectedVideo = editVideoId ? mockVideos.find(v => v.id === editVideoId) : null;

  const toggleVideoSelection = (id: number) => {
    setSelectedVideos(prev => 
      prev.includes(id) ? prev.filter(vid => vid !== id) : [...prev, id]
    );
  };

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

        {hasVideos ? (
          <>
            {/* Filter/Sort Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-muted/50 p-4 rounded-lg">
              <div className="flex flex-wrap gap-2 flex-1">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Videos</SelectItem>
                    <SelectItem value="client">Client Visible</SelectItem>
                    <SelectItem value="internal">Internal Only</SelectItem>
                  </SelectContent>
                </Select>

                <Select defaultValue="all-tags">
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-tags">All Tags</SelectItem>
                    <SelectItem value="intro">Intro</SelectItem>
                    <SelectItem value="walkthrough">Walkthrough</SelectItem>
                    <SelectItem value="case-study">Case Study</SelectItem>
                    <SelectItem value="explainer">Explainer</SelectItem>
                  </SelectContent>
                </Select>

                <Select defaultValue="newest">
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="most-viewed">Most viewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-1 border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Video Grid */}
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {mockVideos.map((video) => (
                <Card
                  key={video.id}
                  className="group hover:shadow-lg transition-shadow cursor-pointer relative"
                  onClick={() => setEditVideoId(video.id)}
                >
                  <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <input
                      type="checkbox"
                      checked={selectedVideos.includes(video.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleVideoSelection(video.id);
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardContent className="p-0">
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                      <Play className="h-16 w-16 text-muted-foreground" />
                      <div className="absolute bottom-2 right-2 bg-black/75 text-white px-2 py-1 rounded text-xs font-medium">
                        {video.duration}
                      </div>
                      <div className="absolute top-2 right-2">
                        {video.visibility === "client" ? (
                          <Eye className="h-4 w-4 text-white drop-shadow" />
                        ) : (
                          <div className="flex items-center gap-1 bg-black/75 px-2 py-1 rounded">
                            <EyeOff className="h-3 w-3 text-white" />
                            <span className="text-xs text-white">Internal</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-[hsl(var(--dark-grey))] line-clamp-1">
                        {video.title}
                      </h3>
                      <p className="text-sm text-[hsl(var(--medium-grey))] line-clamp-2">
                        {video.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {video.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="bg-[hsl(var(--gradient-blue))]/10 text-[hsl(var(--gradient-blue))]"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs text-[hsl(var(--medium-grey))]">
                        <span>Added {video.date}</span>
                        {video.visibility === "client" && (
                          <span>
                            {video.views === 0 ? "Not yet viewed" : `Viewed ${video.views} times`}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <Video className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-[hsl(var(--dark-grey))] mb-2">No videos yet</h3>
            <p className="text-[hsl(var(--medium-grey))] mb-6">Add videos to bring your proposal to life</p>
            <div className="flex flex-wrap gap-3 justify-center">
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
                Upload File
              </Button>
              <Button
                variant="outline"
                onClick={() => setLinkModalOpen(true)}
                className="border-[hsl(var(--gradient-blue))] text-[hsl(var(--gradient-blue))]"
              >
                <LinkIcon className="h-4 w-4" />
                Paste Link
              </Button>
            </div>
            <p className="text-sm text-[hsl(var(--medium-grey))] mt-6">
              Quick intro videos help clients connect with your team
            </p>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {selectedVideos.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[hsl(var(--deep-navy))] text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4 z-50">
            <span className="font-medium">{selectedVideos.length} selected</span>
            <Separator orientation="vertical" className="h-6 bg-white/20" />
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              Change visibility
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              Add tag
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-400 hover:bg-red-400/20"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        )}

        {/* Record Video Modal */}
        <Dialog open={recordModalOpen} onOpenChange={setRecordModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-[hsl(var(--royal-blue))]">Record Video</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <Video className="h-16 w-16 text-muted-foreground" />
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">Camera only</Button>
                  <Button variant="outline" className="flex-1">Screen only</Button>
                  <Button variant="outline" className="flex-1">Camera + Screen</Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Microphone</Label>
                    <Select defaultValue="default">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default Microphone</SelectItem>
                        <SelectItem value="external">External Microphone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Camera</Label>
                    <Select defaultValue="default">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default Camera</SelectItem>
                        <SelectItem value="external">External Camera</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setRecordModalOpen(false)}>Cancel</Button>
                <Button className="bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]/90 text-white">
                  Start Recording
                </Button>
              </div>
              <p className="text-sm text-[hsl(var(--medium-grey))] text-center">
                Recordings are saved directly to this hub
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Upload Modal */}
        <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl text-[hsl(var(--royal-blue))]">Upload Video</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-[hsl(var(--dark-grey))] font-medium mb-2">
                  Drag and drop video here
                </p>
                <p className="text-sm text-[hsl(var(--medium-grey))] mb-4">or</p>
                <Button variant="outline">Choose file</Button>
                <p className="text-xs text-[hsl(var(--medium-grey))] mt-4">
                  Supported formats: MP4, MOV, WebM — Max 500MB
                </p>
              </div>
              <div className="flex justify-end">
                <Button variant="ghost" onClick={() => setUploadModalOpen(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Link Modal */}
        <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl text-[hsl(var(--royal-blue))]">Add Video Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Video URL</Label>
                <Input placeholder="Paste YouTube, Vimeo, or Loom link" />
                <p className="text-xs text-[hsl(var(--medium-grey))]">
                  Supported: YouTube, Vimeo, Loom
                </p>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setLinkModalOpen(false)}>Cancel</Button>
                <Button className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90 text-white">
                  Add Video
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Video Modal */}
        <Dialog open={!!editVideoId} onOpenChange={() => setEditVideoId(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-[hsl(var(--royal-blue))]">Edit Video</DialogTitle>
            </DialogHeader>
            {selectedVideo && (
              <div className="space-y-6">
                {/* Video Player */}
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <Play className="h-20 w-20 text-muted-foreground" />
                </div>

                {/* Editable Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input defaultValue={selectedVideo.title} />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      defaultValue={selectedVideo.description}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedVideo.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-[hsl(var(--gradient-blue))]/10 text-[hsl(var(--gradient-blue))]"
                        >
                          {tag}
                        </Badge>
                      ))}
                      <Button variant="outline" size="sm">
                        <TagIcon className="h-3 w-3" />
                        Add tag
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Thumbnail</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-32 aspect-video bg-muted rounded flex items-center justify-center">
                        <Play className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm text-[hsl(var(--medium-grey))]">Auto-generated</p>
                        <Button variant="outline" size="sm">Upload custom</Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                      <Label>Visible to client</Label>
                      <p className="text-xs text-[hsl(var(--medium-grey))]">
                        Toggle on to show this video in the client portal
                      </p>
                    </div>
                    <Switch defaultChecked={selectedVideo.visibility === "client"} />
                  </div>

                  <div className="space-y-2">
                    <Label>Internal Notes</Label>
                    <Textarea
                      placeholder="Team notes (not visible to client)"
                      rows={3}
                    />
                    <p className="text-xs text-[hsl(var(--medium-grey))]">
                      Example: Re-record with better audio. Good content though.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Video
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setEditVideoId(null)}>
                      Cancel
                    </Button>
                    <Button className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90 text-white">
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
