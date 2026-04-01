import { useState, useEffect } from "react";
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
  Tag, Package, ExternalLink, List
} from "lucide-react";
import type { Category, Product, AffiliateLink, LinkBioCategory, LinkBioItem } from "@shared/schema";

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

  const chartData = stats?.linkStats.slice(0, 10).map((s: any) => ({ name: s.slug, clicks: s.totalClicks })) || [];

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
          <CardHeader><CardTitle>Top Performing Links</CardTitle></CardHeader>
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
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.linkStats.slice(0, 6).map((stat: any, i: number) => (
                <div key={stat.slug} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-gray-400 w-4 text-sm">{i + 1}</div>
                    <div>
                      <div className="font-medium text-sm capitalize">{stat.slug}</div>
                      <div className="text-xs text-gray-400">{stat.todayClicks} today</div>
                    </div>
                  </div>
                  <div className="font-bold text-sm">{stat.totalClicks}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
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

  function openCreate() { setForm(emptyForm); setCreating(true); }
  function openEdit(p: Product) {
    setForm({
      categoryId: String(p.categoryId), slug: p.slug, name: p.name, logo: p.logo,
      rating: p.rating, price: p.price, originalPrice: p.originalPrice, discount: p.discount,
      affiliateSlug: p.affiliateSlug, badge: p.badge || "", shortDescription: p.shortDescription,
      features: (p.features as string[]).join("\n"), pros: (p.pros as string[]).join("\n"),
      cons: (p.cons as string[]).join("\n"), bestFor: p.bestFor,
      scores: JSON.stringify(p.scores), detailedReview: p.detailedReview,
    });
    setEditing(p);
  }

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const fields: [string, string, string][] = [
    ["categoryId", "Category", "select"], ["slug", "Slug", "text"], ["name", "Product Name", "text"],
    ["logo", "Logo URL", "text"], ["rating", "Rating (e.g. 4.9)", "text"],
    ["price", "Price (e.g. $3.99/mo)", "text"], ["originalPrice", "Original Price", "text"],
    ["discount", "Discount (e.g. 67%)", "text"], ["affiliateSlug", "Affiliate Slug", "text"],
    ["badge", "Badge (optional)", "text"], ["shortDescription", "Short Description", "text"],
    ["bestFor", "Best For", "text"], ["features", "Features (one per line)", "textarea"],
    ["pros", "Pros (one per line)", "textarea"], ["cons", "Cons (one per line)", "textarea"],
    ["scores", 'Scores JSON (speed,security,value,ease)', "text"],
    ["detailedReview", "Detailed Review", "textarea"],
  ];

  const ProductForm = ({ onSubmit, loading }: { onSubmit: () => void; loading: boolean }) => (
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
        <Button onClick={onSubmit} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Products ({products.length})</h2>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Add Product</Button>
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
            <ProductForm
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

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function Admin() {
  const [, navigate] = useLocation();
  const { data: admin, isLoading } = useAdmin();

  useEffect(() => {
    if (!isLoading && !admin) navigate("/admin/login");
  }, [admin, isLoading, navigate]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    navigate("/admin/login");
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
              <span className="font-bold text-gray-900">ProPicks</span>
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
          </TabsList>

          <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
          <TabsContent value="categories"><CategoriesTab /></TabsContent>
          <TabsContent value="products"><ProductsTab /></TabsContent>
          <TabsContent value="affiliate"><AffiliateLinksTab /></TabsContent>
          <TabsContent value="linkbio"><LinkBioTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
