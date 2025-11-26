import { useState } from "react";
import { FileText, Upload, Eye, EyeOff, MoreVertical, Download, Trash2, Edit, FileIcon, Image, Sheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Sheet as SheetPanel, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const clientDocuments = [
  {
    id: 1,
    name: "AgentFlow Proposal - Neverland.pdf",
    type: "pdf",
    category: "Proposal Materials",
    size: "4.2 MB",
    uploaded: "Nov 22",
    views: 3,
  },
  {
    id: 2,
    name: "AgentFlow Credentials 2025.pptx",
    type: "ppt",
    category: "Proposal Materials",
    size: "8.1 MB",
    uploaded: "Nov 20",
    views: 1,
  },
  {
    id: 3,
    name: "MediaCo Case Study.pdf",
    type: "pdf",
    category: "Case Studies",
    size: "2.4 MB",
    uploaded: "Nov 20",
    views: 2,
  },
  {
    id: 4,
    name: "TechCorp Case Study.pdf",
    type: "pdf",
    category: "Case Studies",
    size: "1.8 MB",
    uploaded: "Nov 20",
    views: 0,
  },
  {
    id: 5,
    name: "Mutual NDA.docx",
    type: "word",
    category: "Contracts & Legal",
    size: "156 KB",
    uploaded: "Nov 18",
    views: 0,
  },
  {
    id: 6,
    name: "Standard Terms of Service.pdf",
    type: "pdf",
    category: "Contracts & Legal",
    size: "340 KB",
    uploaded: "Nov 18",
    views: 0,
  },
];

const internalDocuments = [
  {
    id: 7,
    name: "Proposal Draft v2.pptx",
    type: "ppt",
    category: "Drafts & Working Files",
    size: "5.6 MB",
    uploaded: "Nov 21",
  },
  {
    id: 8,
    name: "Miro Board Screenshot.png",
    type: "image",
    category: "Research & Strategy",
    size: "1.2 MB",
    uploaded: "Nov 19",
  },
  {
    id: 9,
    name: "Neverland Discovery Notes.docx",
    type: "word",
    category: "Meeting Prep",
    size: "89 KB",
    uploaded: "Nov 15",
  },
  {
    id: 10,
    name: "Pricing Calculator - Internal.xlsx",
    type: "excel",
    category: "Admin",
    size: "234 KB",
    uploaded: "Nov 14",
  },
  {
    id: 11,
    name: "Competitor Analysis.pdf",
    type: "pdf",
    category: "Research & Strategy",
    size: "3.1 MB",
    uploaded: "Nov 10",
  },
];

const getFileIcon = (type: string) => {
  switch (type) {
    case "pdf":
      return <FileText className="h-5 w-5 text-red-500" />;
    case "ppt":
      return <FileIcon className="h-5 w-5 text-orange-500" />;
    case "word":
      return <FileText className="h-5 w-5 text-blue-500" />;
    case "excel":
      return <Sheet className="h-5 w-5 text-green-500" />;
    case "image":
      return <Image className="h-5 w-5 text-purple-500" />;
    default:
      return <FileIcon className="h-5 w-5 text-[hsl(var(--medium-grey))]" />;
  }
};

export function DocumentsSection() {
  const [activeTab, setActiveTab] = useState("client");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const isClientTab = activeTab === "client";
  const documents = isClientTab ? clientDocuments : internalDocuments;
  const selectedDoc = selectedDocId 
    ? [...clientDocuments, ...internalDocuments].find(d => d.id === selectedDocId) 
    : null;

  const toggleDocSelection = (id: number) => {
    setSelectedDocs(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const clientCategories = ["All", "Proposal Materials", "Case Studies", "Contracts & Legal", "Reference Materials"];
  const internalCategories = ["All", "Drafts & Working Files", "Research & Strategy", "Meeting Prep", "Admin"];
  const categories = isClientTab ? clientCategories : internalCategories;

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-[hsl(var(--royal-blue))]">Documents</h1>
          <Button
            onClick={() => setUploadModalOpen(true)}
            className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90 text-white"
          >
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="client" className="flex-1 sm:flex-none">
              Client Documents
              <Badge variant="secondary" className="ml-2">
                {clientDocuments.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="internal" className="flex-1 sm:flex-none">
              Internal Documents
              <Badge variant="secondary" className="ml-2">
                {internalDocuments.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="client" className="space-y-6">
            {/* Info Banner */}
            <div className="bg-[hsl(var(--gradient-blue))]/10 border border-[hsl(var(--gradient-blue))]/20 rounded-lg p-4 flex items-center gap-3">
              <Eye className="h-5 w-5 text-[hsl(var(--gradient-blue))]" />
              <p className="text-sm text-[hsl(var(--dark-grey))]">
                These documents are visible to clients in the portal
              </p>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat.toLowerCase() ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(cat.toLowerCase())}
                  className={categoryFilter === cat.toLowerCase() ? "bg-[hsl(var(--royal-blue))]" : ""}
                >
                  {cat}
                </Button>
              ))}
              <Button variant="ghost" size="sm" className="text-[hsl(var(--medium-grey))]">
                + Add Category
              </Button>
            </div>

            {/* Search */}
            <Input placeholder="Search client documents..." />

            {/* Documents Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientDocuments.map((doc) => (
                      <TableRow
                        key={doc.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedDocId(doc.id)}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedDocs.includes(doc.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleDocSelection(doc.id);
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell>{getFileIcon(doc.type)}</TableCell>
                        <TableCell className="font-medium text-[hsl(var(--dark-grey))]">
                          {doc.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{doc.category}</Badge>
                        </TableCell>
                        <TableCell className="text-[hsl(var(--medium-grey))]">{doc.size}</TableCell>
                        <TableCell className="text-[hsl(var(--medium-grey))]">{doc.uploaded}</TableCell>
                        <TableCell className="text-[hsl(var(--medium-grey))]">
                          {doc.views === 0 ? "Not viewed" : `${doc.views} views`}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem>Copy link</DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit details
                              </DropdownMenuItem>
                              <DropdownMenuItem>Move to Internal</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="internal" className="space-y-6">
            {/* Info Banner */}
            <div className="bg-muted/50 border border-border rounded-lg p-4 flex items-center gap-3">
              <EyeOff className="h-5 w-5 text-[hsl(var(--medium-grey))]" />
              <p className="text-sm text-[hsl(var(--dark-grey))]">
                These documents are only visible to your team — clients cannot see them
              </p>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat.toLowerCase() ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(cat.toLowerCase())}
                  className={categoryFilter === cat.toLowerCase() ? "bg-[hsl(var(--royal-blue))]" : ""}
                >
                  {cat}
                </Button>
              ))}
              <Button variant="ghost" size="sm" className="text-[hsl(var(--medium-grey))]">
                + Add Category
              </Button>
            </div>

            {/* Search */}
            <Input placeholder="Search internal documents..." />

            {/* Documents Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {internalDocuments.map((doc) => (
                      <TableRow
                        key={doc.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedDocId(doc.id)}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedDocs.includes(doc.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleDocSelection(doc.id);
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            {getFileIcon(doc.type)}
                            <EyeOff className="h-3 w-3 absolute -top-1 -right-1 text-[hsl(var(--medium-grey))]" />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-[hsl(var(--dark-grey))]">
                          {doc.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{doc.category}</Badge>
                        </TableCell>
                        <TableCell className="text-[hsl(var(--medium-grey))]">{doc.size}</TableCell>
                        <TableCell className="text-[hsl(var(--medium-grey))]">{doc.uploaded}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit details
                              </DropdownMenuItem>
                              <DropdownMenuItem>Move to Client Documents</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bulk Actions Bar */}
        {selectedDocs.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[hsl(var(--deep-navy))] text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4 z-50">
            <span className="font-medium">{selectedDocs.length} selected</span>
            <Separator orientation="vertical" className="h-6 bg-white/20" />
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
              Move to {isClientTab ? "Internal" : "Client"}
            </Button>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
              Change category
            </Button>
            <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-400/20">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}

        {/* Upload Modal */}
        <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl text-[hsl(var(--royal-blue))]">
                Upload {isClientTab ? "Client" : "Internal"} Document
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-[hsl(var(--dark-grey))] font-medium mb-2">
                  Drag and drop files here
                </p>
                <p className="text-sm text-[hsl(var(--medium-grey))] mb-4">or</p>
                <Button variant="outline">Choose files</Button>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(isClientTab ? clientCategories : internalCategories)
                      .filter(c => c !== "All")
                      .map((cat) => (
                        <SelectItem key={cat} value={cat.toLowerCase()}>
                          {cat}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-muted/50 p-3 rounded text-sm text-[hsl(var(--medium-grey))]">
                {isClientTab ? (
                  <p className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    These files will be visible to clients
                  </p>
                ) : (
                  <p className="flex items-center gap-2">
                    <EyeOff className="h-4 w-4" />
                    These files will NOT be visible to clients
                  </p>
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setUploadModalOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90 text-white">
                  Upload
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Document Detail Panel */}
        <SheetPanel open={!!selectedDocId} onOpenChange={() => setSelectedDocId(null)}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            {selectedDoc && (
              <>
                <SheetHeader>
                  <SheetTitle className="text-2xl text-[hsl(var(--royal-blue))]">
                    Document Details
                  </SheetTitle>
                </SheetHeader>

                <div className="space-y-6 mt-6">
                  {/* Preview */}
                  <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
                    {getFileIcon(selectedDoc.type)}
                    <span className="ml-2 text-[hsl(var(--medium-grey))]">Document Preview</span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Open in new tab
                    </Button>
                  </div>

                  {/* Editable Fields */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input defaultValue={selectedDoc.name} />
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea placeholder="Add notes about this document" rows={3} />
                    </div>

                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select defaultValue={selectedDoc.category.toLowerCase()}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="proposal">Proposal Materials</SelectItem>
                          <SelectItem value="case">Case Studies</SelectItem>
                          <SelectItem value="legal">Contracts & Legal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Client Engagement (for client docs) */}
                  {"views" in selectedDoc && (
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                      <h3 className="font-semibold text-[hsl(var(--dark-grey))]">Client Engagement</h3>
                      <div className="space-y-2 text-sm">
                        <p className="text-[hsl(var(--medium-grey))]">
                          Viewed by: <span className="text-[hsl(var(--dark-grey))]">Sarah Mitchell (Nov 24), James Chen (Nov 23)</span>
                        </p>
                        <p className="text-[hsl(var(--medium-grey))]">
                          Downloaded: <span className="text-[hsl(var(--dark-grey))]">1 time</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Version History */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-[hsl(var(--dark-grey))]">Versions</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                        <div>
                          <p className="font-medium text-sm">v2 — Nov 22 <Badge variant="secondary" className="ml-2">Current</Badge></p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                        <div>
                          <p className="text-sm text-[hsl(var(--medium-grey))]">v1 — Nov 18</p>
                        </div>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload new version
                    </Button>
                  </div>

                  {/* Team Notes */}
                  <div className="space-y-2">
                    <Label>Team Notes</Label>
                    <Textarea
                      placeholder="Notes for your team — not visible to clients even on client documents"
                      rows={3}
                      defaultValue="Latest version approved by Hamish. Ready to share."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 pt-4">
                    <Button className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90 text-white w-full">
                      Save Changes
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1">Copy link</Button>
                      <Button
                        variant="outline"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </SheetPanel>
      </div>

      {/* Sidebar with Stats */}
      <div className="hidden xl:block fixed right-6 top-32 w-64 space-y-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-[hsl(var(--dark-grey))]">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[hsl(var(--medium-grey))]">Client documents:</span>
                <span className="font-medium">6</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[hsl(var(--medium-grey))]">Internal documents:</span>
                <span className="font-medium">4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[hsl(var(--medium-grey))]">Total storage:</span>
                <span className="font-medium">24 MB</span>
              </div>
              <Separator />
              <div>
                <p className="text-[hsl(var(--medium-grey))]">Most viewed:</p>
                <p className="font-medium">AgentFlow Proposal (3 views)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-[hsl(var(--dark-grey))]">Recent Activity</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[hsl(var(--dark-grey))]">Sarah downloaded MediaCo Case Study</p>
                <p className="text-xs text-[hsl(var(--medium-grey))]">2 hours ago</p>
              </div>
              <div>
                <p className="text-[hsl(var(--dark-grey))]">You uploaded Proposal Draft v2</p>
                <p className="text-xs text-[hsl(var(--medium-grey))]">Yesterday</p>
              </div>
              <div>
                <p className="text-[hsl(var(--dark-grey))]">James viewed the NDA</p>
                <p className="text-xs text-[hsl(var(--medium-grey))]">Nov 23</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
