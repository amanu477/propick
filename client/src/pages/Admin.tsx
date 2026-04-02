import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  Shield, LogOut, Plus, Pencil, Trash2, MousePointerClick,
  TrendingUp, Link as LinkIcon, DollarSign, LayoutDashboard,
  Tag, Package, ExternalLink, List, Sparkles, Loader2,
  Zap, CheckCircle, XCircle, Clock, Copy, Check
} from "lucide-react";
import type { Category, Product, AffiliateLink, LinkBioCategory, LinkBioItem, PendingProduct } from "@shared/schema";

// ─── Auth hook ───────────────────────────────────────────────────────────────

function useAdmin() {
  return useQuery({
    queryKey: ["/api/admin/me"],
    queryFn: async () => {
      const res = await fetch("/api/admin/me");
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });
}

// ─── Generic fetch helpers ────────────────────────────────────────────────────

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message);
  }
  return res.json();
}

// ─── Confirm delete dialog ────────────────────────────────────────────────────

function ConfirmDelete({ label, onConfirm, onCancel }: { label: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Dialog open>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete {label}?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500">This action cannot be undone.</p>
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Delete</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────

function AnalyticsTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats/dashboard"],
    queryFn: () => apiFetch("/api/stats/dashboard"),
  });

  if (isLoading) return <div className="text-center py-12 text-gray-400">Loading analytics...</div>;

  const chartData = stats?.linkStats.slice(0, 10).map((s: any) => ({
    name: s.productName || s.slug,
    clicks: s.totalClicks,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Clicks", value: stats?.totalClicks, icon: <MousePointerClick className="h-4 w-4 text-blue-500" />, sub: "+12% from last month", subColor: "text-green-600" },
          { label: "Today's Clicks", value: stats?.todayClicks, icon: <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />, sub: "Real-time", subColor: "text-gray-400" },
          { label: "Active Links", value: stats?.activeLinks, icon: <LinkIcon className="h-4 w-4 text-purple-500" />, sub: "Across all categories", subColor: "text-gray-400" },
          { label: "Est. Revenue", value: stats?.estimatedRevenue, icon: <DollarSign className="h-4 w-4 text-green-500" />, sub: "Based on avg EPC", subColor: "text-gray-400" },
        ].map((m) => (
          <Card key={m.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{m.label}</CardTitle>
              {m.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{m.value}</div>
              <p className={`text-xs mt-1 flex items-center gap-1 ${m.subColor}`}>
                {m.label === "Total Clicks" && <TrendingUp className="w-3 h-3" />}
                {m.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Top Performing Products</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} cursor={{ fill: "#f3f4f6" }} />
                  <Bar dataKey="clicks" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Products by Clicks</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.linkStats.slice(0, 6).map((stat: any, i: number) => (
                <div key={stat.slug} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-gray-400 w-4 text-sm">{i + 1}</div>
                    {stat.productLogo && (
                      <img src={stat.productLogo} alt={stat.productName} className="w-6 h-6 object-contain rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    )}
                    <div>
                      <div className="font-medium text-sm">{stat.productName || stat.slug}</div>
                      <div className="text-xs text-gray-400">/go/{stat.slug} · {stat.todayClicks} today</div>
                    </div>
                  </div>
                  <div className="font-bold text-sm">{stat.totalClicks}</div>
                </div>
              ))}
              {(!stats?.linkStats || stats.linkStats.length === 0) && (
                <div className="text-center py-6 text-gray-400 text-sm">No clicks recorded yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-product breakdown table */}
      {stats?.linkStats?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Affiliate Link Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="text-left pb-2 font-medium">Product</th>
                    <th className="text-left pb-2 font-medium">Affiliate Link</th>
                    <th className="text-right pb-2 font-medium">Today</th>
                    <th className="text-right pb-2 font-medium">Total Clicks</th>
                    <th className="text-right pb-2 font-medium">Est. Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.linkStats.map((stat: any) => (
                    <tr key={stat.slug} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          {stat.productLogo && (
                            <img src={stat.productLogo} alt={stat.productName} className="w-6 h-6 object-contain rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          )}
                          <span className="font-medium">{stat.productName || <span className="text-gray-400 italic">Unknown</span>}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-blue-600">/go/{stat.slug}</td>
                      <td className="py-2.5 text-right">{stat.todayClicks}</td>
                      <td className="py-2.5 text-right font-semibold">{stat.totalClicks}</td>
                      <td className="py-2.5 text-right text-green-600">${(stat.totalClicks * 0.05).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Categories Tab ───────────────────────────────────────────────────────────

function CategoriesTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [form, setForm] = useState({ slug: "", name: "", title: "", description: "", icon: "" });

  const { data: cats = [] } = useQuery<Category[]>({
    queryKey: ["/api/admin/categories"],
    queryFn: () => apiFetch("/api/admin/categories"),
  });

  const createMut = useMutation({
    mutationFn: (data: any) => apiFetch("/api/admin/categories", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/categories"] }); setCreating(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => apiFetch(`/api/admin/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/categories"] }); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/admin/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/categories"] }); setDeleting(null); },
  });

  function openCreate() { setForm({ slug: "", name: "", title: "", description: "", icon: "" }); setCreating(true); }
  function openEdit(c: Category) { setForm({ slug: c.slug, name: c.name, title: c.title, description: c.description, icon: c.icon }); setEditing(c); }

  const CatForm = ({ onSubmit, loading }: { onSubmit: () => void; loading: boolean }) => (
    <div className="space-y-3">
      {[["slug", "Slug (e.g. vpn)"], ["name", "Name"], ["title", "Page Title"], ["description", "Description"], ["icon", "Icon (e.g. Shield)"]].map(([key, label]) => (
        <div key={key} className="space-y-1">
          <Label>{label}</Label>
          <Input value={(form as any)[key]} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))} />
        </div>
      ))}
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</Button>
        <Button onClick={onSubmit} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Categories ({cats.length})</h2>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Add Category</Button>
      </div>

      <div className="grid gap-3">
        {cats.map((cat) => (
          <Card key={cat.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg"><Tag className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <div className="font-semibold">{cat.name}</div>
                  <div className="text-sm text-gray-400">/{cat.slug} · Icon: {cat.icon}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{cat.title}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(cat)}><Pencil className="w-4 h-4" /></Button>
                <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700" onClick={() => setDeleting(cat)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {(creating || editing) && (
        <Dialog open>
          <DialogContent>
            <DialogHeader><DialogTitle>{creating ? "New Category" : "Edit Category"}</DialogTitle></DialogHeader>
            <CatForm
              onSubmit={() => creating ? createMut.mutate(form) : updateMut.mutate({ id: editing!.id, data: form })}
              loading={createMut.isPending || updateMut.isPending}
            />
          </DialogContent>
        </Dialog>
      )}

      {deleting && (
        <ConfirmDelete
          label={deleting.name}
          onConfirm={() => deleteMut.mutate(deleting.id)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────

function ProductsTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [showNewLink, setShowNewLink] = useState(false);
  const emptyNewLink = { url: "", program: "", commission: "", cookieDays: "30" };
  const [newLinkForm, setNewLinkForm] = useState(emptyNewLink);
  const [autoGenOpen, setAutoGenOpen] = useState(false);
  const [autoGenForm, setAutoGenForm] = useState({ categoryId: "", productName: "" });
  const [autoGenError, setAutoGenError] = useState("");

  const emptyForm = {
    categoryId: "", slug: "", name: "", logo: "", rating: "", price: "", originalPrice: "",
    discount: "", affiliateSlug: "", badge: "", shortDescription: "", features: "",
    pros: "", cons: "", bestFor: "", scores: '{"speed":90,"security":90,"value":90,"ease":90}',
    detailedReview: "",
  };
  const [form, setForm] = useState(emptyForm);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/admin/products"],
    queryFn: () => apiFetch("/api/admin/products"),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/admin/categories"],
    queryFn: () => apiFetch("/api/admin/categories"),
  });

  const { data: affiliateLinks = [] } = useQuery<AffiliateLink[]>({
    queryKey: ["/api/admin/affiliate-links"],
    queryFn: () => apiFetch("/api/admin/affiliate-links"),
  });

  const createLinkMut = useMutation({
    mutationFn: (data: any) => apiFetch("/api/admin/affiliate-links", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/affiliate-links"] }); },
  });

  const createMut = useMutation({
    mutationFn: (data: any) => apiFetch("/api/admin/products", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/products"] }); setCreating(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => apiFetch(`/api/admin/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/products"] }); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/admin/products/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/products"] }); setDeleting(null); },
  });

  const autoGenMut = useMutation({
    mutationFn: (data: any) => apiFetch("/api/admin/auto-generate-product", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/products"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/affiliate-links"] });
      setAutoGenOpen(false);
      setAutoGenForm({ categoryId: "", productName: "" });
      setAutoGenError("");
    },
    onError: (err: any) => { setAutoGenError(err.message || "Generation failed. Please try again."); },
  });

  function openCreate() { setForm(emptyForm); setShowNewLink(false); setNewLinkForm(emptyNewLink); setCreating(true); }
  function openEdit(p: Product) {
    setForm({
      categoryId: String(p.categoryId), slug: p.slug, name: p.name, logo: p.logo,
      rating: p.rating, price: p.price, originalPrice: p.originalPrice, discount: p.discount,
      affiliateSlug: p.affiliateSlug, badge: p.badge || "", shortDescription: p.shortDescription,
      features: (p.features as string[]).join("\n"), pros: (p.pros as string[]).join("\n"),
      cons: (p.cons as string[]).join("\n"), bestFor: p.bestFor,
      scores: JSON.stringify(p.scores), detailedReview: p.detailedReview,
    });
    setShowNewLink(false);
    setNewLinkForm(emptyNewLink);
    setEditing(p);
  }

  async function handleSubmit(isCreating: boolean) {
    if (showNewLink && newLinkForm.url && form.affiliateSlug) {
      await createLinkMut.mutateAsync({
        slug: form.affiliateSlug,
        url: newLinkForm.url,
        program: newLinkForm.program || form.name,
        commission: newLinkForm.commission || "0%",
        cookieDays: newLinkForm.cookieDays,
      });
    }
    if (isCreating) {
      createMut.mutate(form);
    } else {
      updateMut.mutate({ id: editing!.id, data: form });
    }
  }

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const fields: [string, string, string][] = [
    ["categoryId", "Category", "select"], ["slug", "Slug", "text"], ["name", "Product Name", "text"],
    ["logo", "Logo URL", "text"], ["rating", "Rating (e.g. 4.9)", "text"],
    ["price", "Price (e.g. $3.99/mo)", "text"], ["originalPrice", "Original Price", "text"],
    ["discount", "Discount (e.g. 67%)", "text"], ["affiliateSlug", "Affiliate Link", "affiliate-select"],
    ["badge", "Badge (optional)", "text"], ["shortDescription", "Short Description", "text"],
    ["bestFor", "Best For", "text"], ["features", "Features (one per line)", "textarea"],
    ["pros", "Pros (one per line)", "textarea"], ["cons", "Cons (one per line)", "textarea"],
    ["scores", 'Scores JSON (speed,security,value,ease)', "text"],
    ["detailedReview", "Detailed Review", "textarea"],
  ];

  const isSubmitting = createMut.isPending || updateMut.isPending || createLinkMut.isPending;

  const ProductForm = ({ isCreating }: { isCreating: boolean }) => (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
      {fields.map(([key, label, type]) => (
        <div key={key} className="space-y-1">
          <Label>{label}</Label>
          {type === "select" ? (
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={(form as any)[key]}
              onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
            >
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          ) : type === "affiliate-select" ? (
            <div className="space-y-2">
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={showNewLink ? "__new__" : (form.affiliateSlug || "")}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setShowNewLink(true);
                  } else {
                    setShowNewLink(false);
                    setForm(f => ({ ...f, affiliateSlug: e.target.value }));
                  }
                }}
              >
                <option value="">Select existing affiliate link</option>
                {affiliateLinks.map((l) => (
                  <option key={l.id} value={l.slug}>/go/{l.slug} — {l.program}</option>
                ))}
                <option value="__new__">+ Create new affiliate link...</option>
              </select>
              {showNewLink && (
                <div className="border border-blue-200 rounded-lg p-3 bg-blue-50 space-y-2">
                  <div className="text-xs font-semibold text-blue-700 mb-1">New Affiliate Link</div>
                  <div className="space-y-1">
                    <Label className="text-xs">Slug (used in /go/slug)</Label>
                    <Input
                      placeholder="e.g. nordvpn"
                      value={form.affiliateSlug}
                      onChange={(e) => setForm(f => ({ ...f, affiliateSlug: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Destination URL</Label>
                    <Input
                      placeholder="https://example.com/aff?ref=..."
                      value={newLinkForm.url}
                      onChange={(e) => setNewLinkForm(f => ({ ...f, url: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Program Name</Label>
                      <Input
                        placeholder="e.g. NordVPN Partners"
                        value={newLinkForm.program}
                        onChange={(e) => setNewLinkForm(f => ({ ...f, program: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Commission</Label>
                      <Input
                        placeholder="e.g. 40%"
                        value={newLinkForm.commission}
                        onChange={(e) => setNewLinkForm(f => ({ ...f, commission: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cookie Days</Label>
                    <Input
                      placeholder="30"
                      value={newLinkForm.cookieDays}
                      onChange={(e) => setNewLinkForm(f => ({ ...f, cookieDays: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : type === "textarea" ? (
            <textarea
              rows={3}
              className="w-full border rounded-md px-3 py-2 text-sm resize-y"
              value={(form as any)[key]}
              onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
            />
          ) : (
            <Input value={(form as any)[key]} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))} />
          )}
        </div>
      ))}
      <div className="flex gap-2 justify-end pt-2 sticky bottom-0 bg-white pb-1">
        <Button variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</Button>
        <Button onClick={() => handleSubmit(isCreating)} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Products ({products.length})</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setAutoGenError(""); setAutoGenForm({ categoryId: "", productName: "" }); setAutoGenOpen(true); }} className="border-purple-300 text-purple-700 hover:bg-purple-50">
            <Sparkles className="w-4 h-4 mr-1" /> AI Generate
          </Button>
          <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Add Product</Button>
        </div>
      </div>

      <div className="grid gap-3">
        {products.map((p) => (
          <Card key={p.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={p.logo} alt={p.name} className="w-10 h-10 object-contain rounded" onError={(e) => { (e.target as HTMLImageElement).src = ""; }} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{p.name}</span>
                    {p.badge && <Badge variant="secondary" className="text-xs">{p.badge}</Badge>}
                  </div>
                  <div className="text-sm text-gray-400">{catMap[p.categoryId] || `Category ${p.categoryId}`} · {p.price} · ⭐ {p.rating}</div>
                  <div className="text-xs text-gray-400">Affiliate: /{p.affiliateSlug}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700" onClick={() => setDeleting(p)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {(creating || editing) && (
        <Dialog open>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{creating ? "New Product" : `Edit: ${editing?.name}`}</DialogTitle></DialogHeader>
            <ProductForm isCreating={!!creating} />
          </DialogContent>
        </Dialog>
      )}

      {deleting && (
        <ConfirmDelete
          label={deleting.name}
          onConfirm={() => deleteMut.mutate(deleting.id)}
          onCancel={() => setDeleting(null)}
        />
      )}

      {autoGenOpen && (
        <Dialog open>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Product Generator
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-700">
                AI will generate a complete product review including name, pricing, pros/cons, features, scores, and an affiliate link — all automatically.
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={autoGenForm.categoryId}
                  onChange={(e) => setAutoGenForm(f => ({ ...f, categoryId: e.target.value }))}
                >
                  <option value="">Select a category...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Product Name <span className="text-gray-400 text-xs">(optional — leave blank to let AI decide)</span></Label>
                <input
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="e.g. CyberGhost, Malwarebytes..."
                  value={autoGenForm.productName}
                  onChange={(e) => setAutoGenForm(f => ({ ...f, productName: e.target.value }))}
                />
              </div>
              {autoGenError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{autoGenError}</div>
              )}
              <div className="flex gap-2 justify-end pt-1">
                <Button variant="outline" onClick={() => { setAutoGenOpen(false); setAutoGenError(""); }} disabled={autoGenMut.isPending}>Cancel</Button>
                <Button
                  onClick={() => autoGenMut.mutate(autoGenForm)}
                  disabled={!autoGenForm.categoryId || autoGenMut.isPending}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {autoGenMut.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-1" /> Generate Product</>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Affiliate Links Tab ──────────────────────────────────────────────────────

function AffiliateLinksTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<AffiliateLink | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<AffiliateLink | null>(null);
  const emptyForm = { slug: "", url: "", program: "", commission: "", cookieDays: "" };
  const [form, setForm] = useState(emptyForm);

  const { data: links = [] } = useQuery<AffiliateLink[]>({
    queryKey: ["/api/admin/affiliate-links"],
    queryFn: () => apiFetch("/api/admin/affiliate-links"),
  });

  const createMut = useMutation({
    mutationFn: (data: any) => apiFetch("/api/admin/affiliate-links", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/affiliate-links"] }); setCreating(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => apiFetch(`/api/admin/affiliate-links/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/affiliate-links"] }); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/admin/affiliate-links/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/affiliate-links"] }); setDeleting(null); },
  });

  function openCreate() { setForm(emptyForm); setCreating(true); }
  function openEdit(l: AffiliateLink) {
    setForm({ slug: l.slug, url: l.url, program: l.program, commission: l.commission, cookieDays: String(l.cookieDays) });
    setEditing(l);
  }

  const LinkForm = ({ onSubmit, loading }: { onSubmit: () => void; loading: boolean }) => (
    <div className="space-y-3">
      {[["slug", "Slug (e.g. nordvpn)"], ["url", "Destination URL"], ["program", "Program Name"], ["commission", "Commission (e.g. 40%)"], ["cookieDays", "Cookie Days (e.g. 30)"]].map(([key, label]) => (
        <div key={key} className="space-y-1">
          <Label>{label}</Label>
          <Input value={(form as any)[key]} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))} />
        </div>
      ))}
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</Button>
        <Button onClick={onSubmit} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Affiliate Links ({links.length})</h2>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Add Link</Button>
      </div>

      <div className="grid gap-3">
        {links.map((l) => (
          <Card key={l.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg"><ExternalLink className="w-5 h-5 text-purple-600" /></div>
                <div>
                  <div className="font-semibold">/go/{l.slug}</div>
                  <div className="text-sm text-gray-400">{l.program} · {l.commission} · {l.cookieDays}d cookie</div>
                  <div className="text-xs text-blue-500 truncate max-w-xs">{l.url}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(l)}><Pencil className="w-4 h-4" /></Button>
                <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700" onClick={() => setDeleting(l)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {(creating || editing) && (
        <Dialog open>
          <DialogContent>
            <DialogHeader><DialogTitle>{creating ? "New Affiliate Link" : "Edit Affiliate Link"}</DialogTitle></DialogHeader>
            <LinkForm
              onSubmit={() => creating ? createMut.mutate(form) : updateMut.mutate({ id: editing!.id, data: form })}
              loading={createMut.isPending || updateMut.isPending}
            />
          </DialogContent>
        </Dialog>
      )}

      {deleting && (
        <ConfirmDelete
          label={`/go/${deleting.slug}`}
          onConfirm={() => deleteMut.mutate(deleting.id)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

// ─── Link Bio Tab ─────────────────────────────────────────────────────────────

function LinkBioTab() {
  const qc = useQueryClient();
  const [editingCat, setEditingCat] = useState<LinkBioCategory | null>(null);
  const [creatingCat, setCreatingCat] = useState(false);
  const [deletingCat, setDeletingCat] = useState<LinkBioCategory | null>(null);
  const [editingItem, setEditingItem] = useState<LinkBioItem | null>(null);
  const [creatingItem, setCreatingItem] = useState(false);
  const [deletingItem, setDeletingItem] = useState<LinkBioItem | null>(null);
  const [catForm, setCatForm] = useState({ title: "", sortOrder: "" });
  const emptyItemForm = { categoryId: "", name: "", description: "", slug: "", emoji: "", isHot: "false", sortOrder: "" };
  const [itemForm, setItemForm] = useState(emptyItemForm);

  const { data: bioCats = [] } = useQuery<LinkBioCategory[]>({
    queryKey: ["/api/admin/link-bio-categories"],
    queryFn: () => apiFetch("/api/admin/link-bio-categories"),
  });

  const { data: bioItems = [] } = useQuery<LinkBioItem[]>({
    queryKey: ["/api/admin/link-bio-items"],
    queryFn: () => apiFetch("/api/admin/link-bio-items"),
  });

  const createCatMut = useMutation({
    mutationFn: (data: any) => apiFetch("/api/admin/link-bio-categories", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/link-bio-categories"] }); setCreatingCat(false); },
  });
  const updateCatMut = useMutation({
    mutationFn: ({ id, data }: any) => apiFetch(`/api/admin/link-bio-categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/link-bio-categories"] }); setEditingCat(null); },
  });
  const deleteCatMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/admin/link-bio-categories/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/link-bio-categories"] }); setDeletingCat(null); },
  });

  const createItemMut = useMutation({
    mutationFn: (data: any) => apiFetch("/api/admin/link-bio-items", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/link-bio-items"] }); setCreatingItem(false); },
  });
  const updateItemMut = useMutation({
    mutationFn: ({ id, data }: any) => apiFetch(`/api/admin/link-bio-items/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/link-bio-items"] }); setEditingItem(null); },
  });
  const deleteItemMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/admin/link-bio-items/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/link-bio-items"] }); setDeletingItem(null); },
  });

  const catMap = Object.fromEntries(bioCats.map((c) => [c.id, c.title]));

  return (
    <div className="space-y-6">
      {/* Bio Categories */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Bio Categories ({bioCats.length})</h2>
          <Button size="sm" onClick={() => { setCatForm({ title: "", sortOrder: "" }); setCreatingCat(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Category
          </Button>
        </div>
        {bioCats.map((cat) => (
          <Card key={cat.id} className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{cat.title}</div>
                <div className="text-xs text-gray-400">Sort order: {cat.sortOrder}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setCatForm({ title: cat.title, sortOrder: String(cat.sortOrder) }); setEditingCat(cat); }}><Pencil className="w-4 h-4" /></Button>
                <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700" onClick={() => setDeletingCat(cat)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Bio Items */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Bio Items ({bioItems.length})</h2>
          <Button size="sm" onClick={() => { setItemForm(emptyItemForm); setCreatingItem(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Item
          </Button>
        </div>
        {bioItems.map((item) => (
          <Card key={item.id} className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.emoji}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{item.name}</span>
                    {item.isHot && <Badge className="text-xs bg-red-500">Hot 🔥</Badge>}
                  </div>
                  <div className="text-sm text-gray-400">{catMap[item.categoryId]} · {item.description}</div>
                  <div className="text-xs text-gray-400">Affiliate: /{item.slug}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => {
                  setItemForm({ categoryId: String(item.categoryId), name: item.name, description: item.description, slug: item.slug, emoji: item.emoji, isHot: String(item.isHot), sortOrder: String(item.sortOrder) });
                  setEditingItem(item);
                }}><Pencil className="w-4 h-4" /></Button>
                <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700" onClick={() => setDeletingItem(item)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Cat dialog */}
      {(creatingCat || editingCat) && (
        <Dialog open>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>{creatingCat ? "New Bio Category" : "Edit Bio Category"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1"><Label>Title</Label><Input value={catForm.title} onChange={(e) => setCatForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Sort Order</Label><Input type="number" value={catForm.sortOrder} onChange={(e) => setCatForm(f => ({ ...f, sortOrder: e.target.value }))} /></div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setCreatingCat(false); setEditingCat(null); }}>Cancel</Button>
                <Button onClick={() => creatingCat ? createCatMut.mutate(catForm) : updateCatMut.mutate({ id: editingCat!.id, data: catForm })} disabled={createCatMut.isPending || updateCatMut.isPending}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Item dialog */}
      {(creatingItem || editingItem) && (
        <Dialog open>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>{creatingItem ? "New Bio Item" : "Edit Bio Item"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Category</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={itemForm.categoryId} onChange={(e) => setItemForm(f => ({ ...f, categoryId: e.target.value }))}>
                  <option value="">Select...</option>
                  {bioCats.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              {[["name", "Name"], ["description", "Description"], ["slug", "Affiliate Slug"], ["emoji", "Emoji"], ["sortOrder", "Sort Order"]].map(([key, label]) => (
                <div key={key} className="space-y-1"><Label>{label}</Label><Input value={(itemForm as any)[key]} onChange={(e) => setItemForm(f => ({ ...f, [key]: e.target.value }))} /></div>
              ))}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isHot" checked={itemForm.isHot === "true"} onChange={(e) => setItemForm(f => ({ ...f, isHot: String(e.target.checked) }))} />
                <Label htmlFor="isHot">Mark as Hot 🔥</Label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setCreatingItem(false); setEditingItem(null); }}>Cancel</Button>
                <Button onClick={() => creatingItem ? createItemMut.mutate(itemForm) : updateItemMut.mutate({ id: editingItem!.id, data: itemForm })} disabled={createItemMut.isPending || updateItemMut.isPending}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {deletingCat && <ConfirmDelete label={deletingCat.title} onConfirm={() => deleteCatMut.mutate(deletingCat.id)} onCancel={() => setDeletingCat(null)} />}
      {deletingItem && <ConfirmDelete label={deletingItem.name} onConfirm={() => deleteItemMut.mutate(deletingItem.id)} onCancel={() => setDeletingItem(null)} />}
    </div>
  );
}

// ─── Automation Tab ──────────────────────────────────────────────────────────

function AutomationTab() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [discovering, setDiscovering] = useState(false);
  const [discoveryLog, setDiscoveryLog] = useState<Array<{ type: string; message: string }>>([]);
  const [discoveryQueued, setDiscoveryQueued] = useState<number | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [discoveryLog]);

  const runDiscovery = async () => {
    setDiscovering(true);
    setDiscoveryLog([]);
    setDiscoveryQueued(null);
    try {
      const res = await fetch("/api/admin/run-discovery", { method: "POST", credentials: "include" });
      if (!res.ok || !res.body) throw new Error("Failed to start discovery");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            setDiscoveryLog(prev => [...prev, event]);
            if (event.type === "done") {
              setDiscoveryQueued(event.queued ?? 0);
              qc.invalidateQueries({ queryKey: ["/api/admin/pending-products"] });
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setDiscoveryLog(prev => [...prev, { type: "error", message: err.message }]);
    } finally {
      setDiscovering(false);
    }
  };

  const { data: pendingList = [], isLoading } = useQuery<PendingProduct[]>({
    queryKey: ["/api/admin/pending-products", filterStatus],
    queryFn: () => fetch(`/api/admin/pending-products?status=${filterStatus}`, { credentials: "include" }).then(r => r.json()),
  });

  const { data: allPending = [] } = useQuery<PendingProduct[]>({
    queryKey: ["/api/admin/pending-products", "pending"],
    queryFn: () => fetch("/api/admin/pending-products?status=pending", { credentials: "include" }).then(r => r.json()),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/admin/categories"],
    queryFn: () => apiFetch("/api/admin/categories"),
  });

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const approveMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/admin/pending-products/${id}/approve`, { method: "POST", credentials: "include" }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/pending-products"] });
      qc.invalidateQueries({ queryKey: ["/api/products"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/admin/pending-products/${id}/reject`, { method: "POST", credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/pending-products"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/admin/pending-products/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/pending-products"] }),
  });

  const webhookUrl = `${window.location.origin}/api/webhook/products`;

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  const statusBadge = (status: string) => {
    if (status === "pending") return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    if (status === "approved") return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
    return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
  };

  return (
    <div className="space-y-6">

      {/* Auto-Discovery */}
      <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-base">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Auto-Discover Real Products
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-normal">
              <Clock className="w-3 h-3" /> Runs daily at 8am automatically
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            Scans each of your categories, finds real top-rated products, generates full AI reviews, and queues them for your approval — all automatically.
          </p>
          <Button
            onClick={runDiscovery}
            disabled={discovering}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            {discovering ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Discovering products...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Run Discovery Now</>
            )}
          </Button>

          {discoveryLog.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-3 max-h-48 overflow-y-auto text-xs font-mono space-y-1">
              {discoveryLog.map((entry, i) => (
                <div key={i} className={
                  entry.type === "error" ? "text-red-400" :
                  entry.type === "done" ? "text-green-400 font-bold" :
                  entry.type === "skip" ? "text-gray-500" :
                  entry.type === "product" ? "text-blue-300" :
                  entry.type === "category" ? "text-yellow-300" :
                  "text-gray-300"
                }>
                  {entry.type === "product" && "  → "}
                  {entry.type === "skip" && "  ⊘ "}
                  {entry.type === "category" && "▶ "}
                  {entry.type === "done" && "✓ "}
                  {entry.type === "error" && "✗ "}
                  {entry.message}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          )}

          {discoveryQueued !== null && !discovering && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span><strong>{discoveryQueued} new products</strong> queued below — review and approve to publish them.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Header stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg"><Clock className="w-5 h-5 text-yellow-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Awaiting Review</p>
              <p className="text-2xl font-bold text-gray-900">{allPending.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-gray-500 mb-2 font-medium">Webhook URL</p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate">{webhookUrl}</code>
              <Button size="sm" variant="outline" onClick={copyWebhook} data-testid="button-copy-webhook">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-gray-500 mb-1 font-medium">Auth Header</p>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded block">x-api-key: your_webhook_key</code>
            <p className="text-xs text-gray-400 mt-1">Find the key in Secrets → WEBHOOK_API_KEY</p>
          </CardContent>
        </Card>
      </div>

      {/* Approval Queue */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Approval Queue</h3>
          <div className="flex gap-2">
            {["pending", "approved", "rejected"].map(s => (
              <Button key={s} size="sm" variant={filterStatus === s ? "default" : "outline"} onClick={() => { setFilterStatus(s); setSelectedCategoryId(null); }} data-testid={`button-filter-${s}`} className="capitalize">{s}</Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading...</div>
        ) : pendingList.length === 0 ? (
          <Card><CardContent className="pt-8 pb-8 text-center text-gray-400">
            <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No {filterStatus} products</p>
            <p className="text-sm mt-1">Products submitted via webhook or AI will appear here</p>
          </CardContent></Card>
        ) : (() => {
          const grouped: Record<number, PendingProduct[]> = {};
          for (const p of pendingList) {
            const cid = p.categoryId ?? 0;
            if (!grouped[cid]) grouped[cid] = [];
            grouped[cid].push(p);
          }
          const catIds = Object.keys(grouped).map(Number);
          const activeCatId = selectedCategoryId !== null && grouped[selectedCategoryId] ? selectedCategoryId : catIds[0];
          const visibleProducts = grouped[activeCatId] || [];
          const activeCat = catMap[activeCatId];

          return (
            <div>
              {/* Horizontal category tabs */}
              <div className="flex gap-2 flex-wrap mb-4">
                {catIds.map(cid => {
                  const cat = catMap[cid];
                  const isActive = cid === activeCatId;
                  return (
                    <button
                      key={cid}
                      onClick={() => setSelectedCategoryId(cid)}
                      data-testid={`button-cat-${cid}`}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                        isActive
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      {cat ? cat.name : `Category ${cid || "Unknown"}`}
                      <span className={`text-xs rounded-full px-1.5 py-0.5 ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"}`}>
                        {grouped[cid].length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Products for selected category */}
              <div className="space-y-3">
                {visibleProducts.map(p => (
                  <Card key={p.id} data-testid={`card-pending-${p.id}`} className="overflow-hidden">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {p.logo && <img src={p.logo} alt={p.name} className="w-10 h-10 object-contain rounded border bg-white flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900" data-testid={`text-pending-name-${p.id}`}>{p.name}</span>
                              {statusBadge(p.status)}
                              <Badge variant="outline" className="text-xs">{p.source}</Badge>
                            </div>
                            <p className="text-sm text-gray-500 truncate mt-0.5">{p.shortDescription}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                              <span>⭐ {p.rating}</span>
                              <span>💰 {p.price}</span>
                              <span>🔗 {p.affiliateSlug}</span>
                              <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button size="sm" variant="outline" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)} data-testid={`button-expand-${p.id}`}>
                            {expandedId === p.id ? "Less" : "Preview"}
                          </Button>
                          {p.status === "pending" && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => approveMutation.mutate(p.id)} disabled={approveMutation.isPending} data-testid={`button-approve-${p.id}`}>
                                <CheckCircle className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => rejectMutation.mutate(p.id)} disabled={rejectMutation.isPending} data-testid={`button-reject-${p.id}`}>
                                <XCircle className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                          {p.status !== "pending" && (
                            <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => deleteMutation.mutate(p.id)} data-testid={`button-delete-pending-${p.id}`}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {expandedId === p.id && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                            <div><span className="text-gray-400 block">Category</span><strong>{activeCat ? activeCat.name : `#${activeCatId}`}</strong></div>
                            <div><span className="text-gray-400 block">Affiliate Slug</span><strong>{p.affiliateSlug}</strong></div>
                            <div><span className="text-gray-400 block">Commission</span><strong>{p.commission}</strong></div>
                            <div><span className="text-gray-400 block">Cookie Days</span><strong>{p.cookieDays}</strong></div>
                          </div>
                          {(p.pros as string[])?.length > 0 && (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-400 font-medium mb-1">Pros</p>
                                <ul className="space-y-1">{(p.pros as string[]).map((pro, i) => <li key={i} className="text-green-700">✓ {pro}</li>)}</ul>
                              </div>
                              <div>
                                <p className="text-gray-400 font-medium mb-1">Cons</p>
                                <ul className="space-y-1">{(p.cons as string[]).map((con, i) => <li key={i} className="text-red-600">✗ {con}</li>)}</ul>
                              </div>
                            </div>
                          )}
                          {p.detailedReview && <div className="text-sm text-gray-600 bg-gray-50 rounded p-3 line-clamp-3">{p.detailedReview}</div>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function Admin() {
  const [, navigate] = useLocation();
  const { data: admin, isLoading } = useAdmin();

  useEffect(() => {
    if (!isLoading && !admin) navigate("/admin/login");
  }, [admin, isLoading, navigate]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-600 rounded-lg"><Shield className="w-5 h-5 text-white" /></div>
            <div>
              <span className="font-bold text-gray-900">PickVera</span>
              <span className="text-gray-400 text-sm ml-2">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">Signed in as <strong>{admin.username}</strong></span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="analytics">
          <TabsList className="mb-6 flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="analytics" className="flex items-center gap-1.5">
              <LayoutDashboard className="w-4 h-4" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-1.5">
              <Tag className="w-4 h-4" /> Categories
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-1.5">
              <Package className="w-4 h-4" /> Products
            </TabsTrigger>
            <TabsTrigger value="affiliate" className="flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4" /> Affiliate Links
            </TabsTrigger>
            <TabsTrigger value="linkbio" className="flex items-center gap-1.5">
              <List className="w-4 h-4" /> Link Bio
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Automation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
          <TabsContent value="categories"><CategoriesTab /></TabsContent>
          <TabsContent value="products"><ProductsTab /></TabsContent>
          <TabsContent value="affiliate"><AffiliateLinksTab /></TabsContent>
          <TabsContent value="linkbio"><LinkBioTab /></TabsContent>
          <TabsContent value="automation"><AutomationTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
