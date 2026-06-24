"use client";

import dynamic from "next/dynamic";
import gsap from "gsap";
import { isReducedMotion, motion } from "../../lib/gsapMotion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import type { Content, ContentType } from "../../types/content";
import type { Category } from "../../types/category";
import type { Subcategory } from "../../types/subcategory";
import {
  type PublicationStatus,
  publicationStatusLabel,
} from "../../lib/publicationStatus";
import { extractYouTubeId, getYouTubeThumbnail, isYouTubeUrl } from "../../lib/youtube";
import { isPlayableAudioUrl, uploadMediaFile } from "../../lib/uploadClient";

const AgendaAdminPanel = dynamic(
  () => import("../../components/monsite/AgendaAdminPanel").then((m) => ({ default: m.AgendaAdminPanel })),
  { loading: () => <p className="admin-field__hint">Chargement…</p> }
);
const DashboardAdminPanel = dynamic(
  () => import("../../components/monsite/DashboardAdminPanel").then((m) => ({ default: m.DashboardAdminPanel })),
  { loading: () => <p className="admin-field__hint">Chargement…</p> }
);
const NewsletterAdminPanel = dynamic(
  () => import("../../components/monsite/NewsletterAdminPanel").then((m) => ({ default: m.NewsletterAdminPanel })),
  { loading: () => <p className="admin-field__hint">Chargement…</p> }
);
const PartnersAdminPanel = dynamic(
  () => import("../../components/monsite/PartnersAdminPanel").then((m) => ({ default: m.PartnersAdminPanel })),
  { loading: () => <p className="admin-field__hint">Chargement…</p> }
);
const SiteSettingsAdminPanel = dynamic(
  () => import("../../components/monsite/SiteSettingsAdminPanel").then((m) => ({ default: m.SiteSettingsAdminPanel })),
  { loading: () => <p className="admin-field__hint">Chargement…</p> }
);
const ThomasProfileAdminPanel = dynamic(
  () => import("../../components/monsite/ThomasProfileAdminPanel").then((m) => ({ default: m.ThomasProfileAdminPanel })),
  { loading: () => <p className="admin-field__hint">Chargement…</p> }
);

type AdminTab =
  | "dashboard"
  | "publier"
  | "contenus"
  | "categories"
  | "agenda"
  | "newsletter"
  | "profil"
  | "site"
  | "partenaires";
type ToastKind = "success" | "error" | "info";
type ToastAction = { label: string; onClick: () => void };
type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
  action?: ToastAction;
  duration: number;
};

const tabs: { id: AdminTab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "publier", label: "Publier" },
  { id: "contenus", label: "Contenus" },
  { id: "categories", label: "Rubriques" },
  { id: "agenda", label: "Agenda" },
  { id: "newsletter", label: "Newsletter" },
  { id: "profil", label: "Profil Thomas" },
  { id: "site", label: "Textes site" },
  { id: "partenaires", label: "Collaborer" },
];

const tabTitles: Record<AdminTab, string> = {
  dashboard: "Dashboard",
  publier: "Publier",
  contenus: "Contenus",
  categories: "Rubriques",
  agenda: "Agenda",
  newsletter: "Newsletter",
  profil: "Profil Thomas",
  site: "Textes du site",
  partenaires: "Page Collaborer",
};

const typeLabels: Record<ContentType, string> = {
  video: "Vidéo",
  article: "Publication",
  audio: "Audio",
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default function MonSitePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [type, setType] = useState<ContentType>("video");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [contentStatus, setContentStatus] = useState<PublicationStatus>("draft");
  const [notifySubscribers, setNotifySubscribers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [assistantLoading, setAssistantLoading] = useState<"summary" | "tags" | "seo" | null>(null);

  const [contents, setContents] = useState<Content[]>([]);
  const [loadingContents, setLoadingContents] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | ContentType>("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");
  const [subcategoryDescription, setSubcategoryDescription] = useState("");
  const [subcategoryPosition, setSubcategoryPosition] = useState("100");
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [isSavingSubcategory, setIsSavingSubcategory] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const toastTimersRef = useRef<Map<number, number>>(new Map());
  const formRef = useRef<HTMLFormElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const pendingDeletesRef = useRef<
    Map<string, { item: Content; timeout: number }>
  >(new Map());

  const dismissToast = useCallback((id: number) => {
    const timer = toastTimersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      toastTimersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (kind: ToastKind, message: string, action?: ToastAction, duration = 3200) => {
      const id = ++toastIdRef.current;
      setToasts((prev) => [...prev, { id, kind, message, action, duration }]);
      const timer = window.setTimeout(() => {
        toastTimersRef.current.delete(id);
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
      toastTimersRef.current.set(id, timer);
      return id;
    },
    []
  );

  // Wrapper fetch avec gestion du 401 (session expiree cote serveur)
  const apiFetch = useCallback(
    async (url: string, init?: RequestInit): Promise<Response> => {
      const response = await fetch(url, init);
      if (response.status === 401) {
        pushToast(
          "error",
          "Session expiree. Reconnecte-toi pour continuer.",
          undefined,
          4500
        );
        window.setTimeout(() => router.replace("/monsite"), 900);
      }
      return response;
    },
    [pushToast, router]
  );

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(el, { opacity: 0, y: 8 }, {
        opacity: 1,
        y: 0,
        duration: motion.duration.revealFast,
        ease: motion.ease.outSoft,
      });
      gsap.fromTo(
        ".admin-reveal",
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: motion.duration.revealMed,
          ease: motion.ease.out,
          stagger: motion.duration.staggerTight,
        }
      );
    }, el);
    return () => ctx.revert();
  }, [activeTab]);

  /* On charge TOUS les contenus (pas de filtre serveur) : le filtrage par    */
  /* type est applique cote client pour pouvoir calculer les comptes globaux */
  /* et afficher (videos : 12, articles : 8, audios : 3) dans le select.     */
  const loadContents = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoadingContents(true);
      try {
        const response = await apiFetch("/api/content?include_drafts=1&limit=100&offset=0", {
          cache: "no-store",
        });
        const result = (await response.json()) as { data?: Content[]; error?: string };
        if (!response.ok) {
          if (response.status !== 401) {
            pushToast("error", result.error ?? "Impossible de charger les contenus.");
          }
          setContents([]);
          return;
        }
        setContents(Array.isArray(result.data) ? result.data : []);
      } catch {
        pushToast("error", "Erreur réseau pendant le chargement.");
        setContents([]);
      } finally {
        if (!opts?.silent) setLoadingContents(false);
      }
    },
    [apiFetch, pushToast]
  );

  const loadCategories = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoadingCategories(true);
      try {
        const response = await apiFetch("/api/categories", { cache: "no-store" });
        const result = (await response.json()) as { data?: Category[]; error?: string };
        if (!response.ok) {
          if (response.status !== 401) {
            pushToast("error", result.error ?? "Impossible de charger les categories.");
          }
          setCategories([]);
          return;
        }
        const list = Array.isArray(result.data) ? result.data : [];
        setCategories(list);
        if (!parentCategoryId && list[0]?.id) {
          setParentCategoryId(list[0].id);
        }
      } catch {
        pushToast("error", "Erreur réseau pendant le chargement des catégories.");
        setCategories([]);
      } finally {
        if (!opts?.silent) setLoadingCategories(false);
      }
    },
    [apiFetch, parentCategoryId, pushToast]
  );

  const loadSubcategories = useCallback(
    async (opts?: { silent?: boolean; categoryId?: string }) => {
      if (!opts?.silent) setLoadingSubcategories(true);
      try {
        const query = opts?.categoryId ? `?category_id=${encodeURIComponent(opts.categoryId)}` : "";
        const response = await apiFetch(`/api/subcategories${query}`, { cache: "no-store" });
        const result = (await response.json()) as { data?: Subcategory[]; error?: string };
        if (!response.ok) {
          if (response.status !== 401) {
            pushToast("error", result.error ?? "Impossible de charger les rubriques.");
          }
          setSubcategories([]);
          return;
        }
        setSubcategories(Array.isArray(result.data) ? result.data : []);
      } catch {
        pushToast("error", "Erreur réseau pendant le chargement des rubriques.");
        setSubcategories([]);
      } finally {
        if (!opts?.silent) setLoadingSubcategories(false);
      }
    },
    [apiFetch, pushToast]
  );

  useEffect(() => {
    if (activeTab === "contenus") {
      void loadContents();
    }
  }, [activeTab, loadContents]);

  useEffect(() => {
    if (activeTab === "categories" || activeTab === "publier" || activeTab === "contenus") {
      void loadCategories({ silent: activeTab !== "categories" });
    }
  }, [activeTab, loadCategories]);

  useEffect(() => {
    if (activeTab === "categories" || activeTab === "publier" || activeTab === "contenus") {
      void loadSubcategories({ silent: activeTab !== "categories" });
    }
  }, [activeTab, loadSubcategories]);

  useEffect(() => {
    if (!selectedCategoryId) return;
    const stillValid = subcategories.some(
      (s) => s.id === selectedSubcategoryId && s.category_id === selectedCategoryId
    );
    if (!stillValid) setSelectedSubcategoryId("");
  }, [selectedCategoryId, selectedSubcategoryId, subcategories]);

  async function uploadFile(file: File, kind: "image" | "audio") {
    const result = await uploadMediaFile(apiFetch, file, kind);
    if (!result && file) {
      pushToast("error", "Upload impossible.");
    }
    return result;
  }

  async function onImageFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const result = await uploadFile(file, "image");
      if (result?.kind === "image") {
        setImageUrl(result.url);
        pushToast("success", "Image uploadée.");
      }
    } catch {
      pushToast("error", "Erreur réseau pendant l'upload.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function onAudioFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingAudio(true);
    try {
      const result = await uploadFile(file, "audio");
      if (result?.kind === "audio") {
        setContent(result.url);
        pushToast("success", "Audio uploade.");
      }
    } catch {
      pushToast("error", "Erreur réseau pendant l'upload.");
    } finally {
      setIsUploadingAudio(false);
      event.target.value = "";
    }
  }

  function resetForm() {
    setTitle("");
    setTitleError(false);
    setType("video");
    setContent("");
    setImageUrl("");
    setSelectedCategoryId("");
    setSelectedSubcategoryId("");
    setTagsInput("");
    setIsFeatured(false);
    setContentStatus("draft");
    setNotifySubscribers(false);
    setEditingContentId(null);
  }

  function resetSubcategoryForm() {
    setSubcategoryName("");
    setSubcategoryDescription("");
    setSubcategoryPosition("100");
    setEditingSubcategoryId(null);
  }

  const publishSubcategoryOptions = useMemo(() => {
    if (!selectedCategoryId) return [];
    return subcategories
      .filter((s) => s.category_id === selectedCategoryId)
      .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name, "fr"));
  }, [selectedCategoryId, subcategories]);

  const parentSubcategories = useMemo(() => {
    if (!parentCategoryId) return [];
    return subcategories
      .filter((s) => s.category_id === parentCategoryId)
      .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name, "fr"));
  }, [parentCategoryId, subcategories]);

  // Supprime l'erreur de titre des que l'utilisateur corrige
  useEffect(() => {
    if (titleError && title.trim()) setTitleError(false);
  }, [title, titleError]);

  // Video YouTube : si aucune image fournie, on pre-remplit avec la miniature.
  useEffect(() => {
    if (type !== "video") return;
    if (imageUrl.trim()) return;
    const ytId = extractYouTubeId(content.trim());
    if (!ytId) return;
    setImageUrl(getYouTubeThumbnail(ytId, "max"));
  }, [type, content, imageUrl]);

  // Raccourci Ctrl/Cmd + Enter pour publier quand l'onglet Publier est actif
  useEffect(() => {
    if (activeTab !== "publier") return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        const active = document.activeElement as HTMLElement | null;
        if (active?.closest(".admin-form")) {
          event.preventDefault();
          formRef.current?.requestSubmit();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeTab]);

  async function onPublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setTitleError(true);
      titleInputRef.current?.focus();
      pushToast("error", "Le titre est obligatoire.");
      return;
    }
    if (!type) {
      pushToast("error", "Le type est obligatoire.");
      return;
    }
    const normalizedContent = content.trim();
    if (type === "video" && !isYouTubeUrl(normalizedContent)) {
      pushToast("error", "Le lien vidéo doit être une URL YouTube valide.");
      return;
    }
    if (type === "article" && normalizedContent.length < 80) {
      pushToast("error", "Un article doit contenir au moins 80 caractères.");
      return;
    }
    if (type === "audio") {
      if (!normalizedContent) {
        pushToast("error", "Le champ audio est obligatoire (upload ou URL).");
        return;
      }
      const audioOk =
        isPlayableAudioUrl(normalizedContent);
      if (!audioOk) {
        pushToast("error", "Le contenu audio doit être une URL publique ou /uploads/audio/...");
        return;
      }
    }

    if (!selectedSubcategoryId) {
      pushToast("error", "Choisissez une rubrique (sous-catégorie) avant de publier.");
      return;
    }

    setIsSubmitting(true);
    try {
      const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
      const isEditing = Boolean(editingContentId);
      const endpoint = isEditing ? "/api/content/update" : "/api/content/create";
      const method = isEditing ? "PUT" : "POST";

      const response = await apiFetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingContentId ?? undefined,
          title: title.trim(),
          type,
          content: normalizedContent,
          image_url: imageUrl.trim(),
          category_id: selectedCategoryId || null,
          subcategory_id: selectedSubcategoryId,
          tags,
          is_featured: isFeatured,
          status: contentStatus,
          ...(contentStatus === "published" && notifySubscribers ? { notify: true } : {}),
        }),
      });

      const result = (await response.json()) as { error?: string; data?: { title?: string } };
      if (!response.ok) {
        if (response.status !== 401) {
          pushToast("error", result.error ?? "Echec de publication.");
        }
        return;
      }

      pushToast(
        "success",
        isEditing
          ? `Contenu modifie : ${result.data?.title ?? title.trim()}`
          : `Contenu publie : ${result.data?.title ?? title.trim()}`
      );

      // Flash de succes vert sur le formulaire
      if (formRef.current) {
        formRef.current.classList.add("admin-form--flash");
        gsap.fromTo(
          formRef.current,
          { scale: 0.995, opacity: 0.85 },
          {
            scale: 1,
            opacity: 1,
            duration: motion.duration.revealMed,
            ease: motion.ease.outSoft,
            onComplete: () => {
              window.setTimeout(() => {
                formRef.current?.classList.remove("admin-form--flash");
              }, 650);
            },
          }
        );
      }

      resetForm();
      void loadContents({ silent: true });
    } catch {
      pushToast("error", "Erreur réseau. Réessaie.");
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Suppression UX-friendly : immediate retrait de l'UI + 5s pour annuler via toast.
   * L'appel API n'est lance qu'a l'expiration. Si l'utilisateur annule, rien n'est
   * envoye au serveur -> pas besoin d'endpoint de restauration.
   */
  function onDeleteContent(id: string, label: string) {
    if (typeof window !== "undefined" && !window.confirm(`Supprimer "${label}" ?`)) return;

    const item = contents.find((c) => c.id === id);
    if (!item) return;

    setContents((prev) => prev.filter((c) => c.id !== id));

    const UNDO_DELAY = 5000;

    const timeout = window.setTimeout(async () => {
      pendingDeletesRef.current.delete(id);
      try {
        const response = await apiFetch("/api/content/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!response.ok) {
          const result = (await response.json()) as { error?: string };
          setContents((prev) => {
            if (prev.some((c) => c.id === id)) return prev;
            return [item, ...prev].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
          });
          if (response.status !== 401) {
            pushToast("error", result.error ?? "Suppression impossible.");
          }
        }
      } catch {
        setContents((prev) => {
          if (prev.some((c) => c.id === id)) return prev;
          return [item, ...prev].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });
        pushToast("error", "Erreur réseau pendant la suppression.");
      }
    }, UNDO_DELAY);

    pendingDeletesRef.current.set(id, { item, timeout });

    pushToast(
      "success",
      `Supprime : ${label}`,
      {
        label: "Annuler",
        onClick: () => {
          const pending = pendingDeletesRef.current.get(id);
          if (!pending) return;
          window.clearTimeout(pending.timeout);
          pendingDeletesRef.current.delete(id);
          setContents((prev) =>
            [pending.item, ...prev].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
          );
          pushToast("info", "Suppression annulee.");
        },
      },
      UNDO_DELAY
    );
  }

  // Nettoyage : annule les suppressions en attente si on quitte la page
  useEffect(() => {
    return () => {
      for (const pending of pendingDeletesRef.current.values()) {
        window.clearTimeout(pending.timeout);
      }
      pendingDeletesRef.current.clear();
      for (const timer of toastTimersRef.current.values()) {
        window.clearTimeout(timer);
      }
      toastTimersRef.current.clear();
    };
  }, []);

  function onEditContent(item: Content) {
    setActiveTab("publier");
    setEditingContentId(item.id);
    setTitle(item.title);
    setType(item.type);
    setContent(item.content);
    setImageUrl(item.image_url);
    setSelectedCategoryId(item.category_id ?? "");
    setSelectedSubcategoryId(item.subcategory_id ?? "");
    setTagsInput(item.tags.join(", "));
    setIsFeatured(Boolean(item.is_featured));
    setContentStatus(item.status ?? "draft");
    setNotifySubscribers(false);
    pushToast("info", "Mode edition: modifie puis valide.");
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function onEditSubcategory(item: Subcategory) {
    setParentCategoryId(item.category_id);
    setSubcategoryName(item.name);
    setSubcategoryDescription(item.description ?? "");
    setSubcategoryPosition(String(item.position ?? 100));
    setEditingSubcategoryId(item.id);
    pushToast("info", "Mode édition rubrique actif.");
  }

  async function onDeleteSubcategory(item: Subcategory) {
    if (typeof window !== "undefined" && !window.confirm(`Supprimer la rubrique « ${item.name} » ?`)) return;
    try {
      const response = await apiFetch(`/api/subcategories/${item.id}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        if (response.status !== 401) {
          pushToast("error", result.error ?? "Suppression impossible.");
        }
        return;
      }
      pushToast("success", `Rubrique supprimée : ${item.name}`);
      if (editingSubcategoryId === item.id) resetSubcategoryForm();
      void loadSubcategories({ silent: true });
    } catch {
      pushToast("error", "Erreur réseau pendant la suppression.");
    }
  }

  async function onSubmitSubcategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = subcategoryName.trim();
    if (!parentCategoryId) {
      pushToast("error", "Choisissez une catégorie parente.");
      return;
    }
    if (!name) {
      pushToast("error", "Le nom de la rubrique est obligatoire.");
      return;
    }

    setIsSavingSubcategory(true);
    try {
      const isEditing = Boolean(editingSubcategoryId);
      const endpoint = isEditing ? `/api/subcategories/${editingSubcategoryId}` : "/api/subcategories";
      const method = isEditing ? "PUT" : "POST";
      const response = await apiFetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEditing
            ? {
                name,
                description: subcategoryDescription.trim(),
                position: Number.isFinite(Number(subcategoryPosition)) ? Number(subcategoryPosition) : 100,
              }
            : {
                category_id: parentCategoryId,
                name,
                description: subcategoryDescription.trim(),
                position: Number.isFinite(Number(subcategoryPosition)) ? Number(subcategoryPosition) : 100,
              }
        ),
      });
      const result = (await response.json()) as { error?: string; data?: { name?: string } };
      if (!response.ok) {
        if (response.status !== 401) {
          pushToast("error", result.error ?? "Échec de l'enregistrement de la rubrique.");
        }
        return;
      }

      pushToast(
        "success",
        isEditing
          ? `Rubrique modifiée : ${result.data?.name ?? name}`
          : `Rubrique créée : ${result.data?.name ?? name}`
      );
      resetSubcategoryForm();
      void loadSubcategories({ silent: true });
    } catch {
      pushToast("error", "Erreur réseau. Réessaie.");
    } finally {
      setIsSavingSubcategory(false);
    }
  }

  const existingTagSuggestions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of contents) {
      for (const tag of item.tags ?? []) {
        const trimmed = tag.trim();
        if (!trimmed) continue;
        const key = trimmed.toLowerCase();
        if (!map.has(key)) map.set(key, trimmed);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, "fr")).slice(0, 18);
  }, [contents]);

  function onToggleTagSuggestion(tag: string) {
    const current = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const exists = current.some((t) => t.toLowerCase() === tag.toLowerCase());
    const next = exists ? current.filter((t) => t.toLowerCase() !== tag.toLowerCase()) : [...current, tag];
    setTagsInput(next.join(", "));
  }

  async function runAssistant(action: "summary" | "tags" | "seo") {
    if (!content.trim()) {
      pushToast("info", "Ajoute d'abord un contenu pour lancer l'assistance.");
      return;
    }

    setAssistantLoading(action);
    await new Promise((resolve) => setTimeout(resolve, 650));

    const normalized = content.replace(/\s+/g, " ").trim();
    const words = normalized.split(" ").filter(Boolean);

    if (action === "summary") {
      const summary = words.slice(0, 24).join(" ");
      setContent(`${summary}${words.length > 24 ? "..." : ""}`);
      pushToast("success", "Resume genere.");
    }

    if (action === "tags") {
      const extracted = words
        .filter((w) => w.length > 4)
        .map((w) => w.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, ""))
        .filter(Boolean);
      const unique = Array.from(new Set(extracted)).slice(0, 5);
      setTagsInput(unique.join(", "));
      pushToast("success", "Tags suggeres.");
    }

    if (action === "seo") {
      const currentTitle = title.trim();
      if (currentTitle) {
        const seoTitle =
          currentTitle.length > 55 ? currentTitle.slice(0, 55).trim() : `${currentTitle} | Analyse`;
        setTitle(seoTitle);
      }
      pushToast("success", "Titre optimise SEO.");
    }

    setAssistantLoading(null);
  }

  let panel: ReactNode = null;

  if (activeTab === "dashboard") {
    panel = (
      <DashboardAdminPanel
        apiFetch={apiFetch}
        pushToast={pushToast}
        onEditContent={onEditContent}
        onOpenTab={(tab) => setActiveTab(tab)}
      />
    );
  }

  if (activeTab === "publier") {
    panel = (
      <form ref={formRef} className="admin-form admin-reveal" onSubmit={onPublish}>
        {editingContentId ? (
          <div className="admin-editBanner">
            <span className="admin-editBanner__dot" aria-hidden="true" />
            Mode edition actif
          </div>
        ) : null}

        <div className={`admin-field ${titleError ? "admin-field--error" : ""}`}>
          <label htmlFor="title">Titre</label>
          <input
            ref={titleInputRef}
            id="title"
            name="title"
            placeholder="Titre du contenu"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={titleError}
            aria-describedby={titleError ? "title-error" : undefined}
          />
          {titleError ? (
            <p id="title-error" className="admin-field__error">
              Le titre est obligatoire.
            </p>
          ) : null}
        </div>
        <div className="admin-field">
          <label htmlFor="type">Type</label>
          <select id="type" name="type" value={type} onChange={(e) => setType(e.target.value as ContentType)}>
            <option value="video">Vidéo</option>
            <option value="article">Publication (texte)</option>
            <option value="audio">Audio</option>
          </select>
        </div>
        <div className="admin-field">
          <label htmlFor="content">
            {type === "article"
              ? "Texte de la publication"
              : type === "video"
              ? "Lien vidéo YouTube"
              : "Lien audio ou URL publique"}
          </label>
          <textarea
            id="content"
            name="content"
            rows={type === "article" ? 14 : 3}
            placeholder={
              type === "article"
                ? "Rédige ton article comme en presse : un paragraphe par bloc, séparés par une ligne vide…"
                : type === "audio"
                ? "/uploads/audio/... ou https://..."
                : "https://www.youtube.com/watch?v=..."
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {type === "article" ? (
            <p className="admin-field__hint">
              Format texte long (minimum 80 caractères). Les retours à la ligne créent les paragraphes à la lecture.
            </p>
          ) : null}
        </div>
        {type === "audio" ? (
          <div className="admin-field">
            <label htmlFor="audioUpload">Audio (upload)</label>
            <input
              id="audioUpload"
              name="audioUpload"
              type="file"
              accept="audio/*"
              onChange={onAudioFileChange}
              disabled={isUploadingAudio}
            />
            {isUploadingAudio ? (
              <p className="admin-assistantState">
                <span className="admin-loader" aria-hidden="true" />
                Upload audio en cours...
              </p>
            ) : null}
            {content && !isUploadingAudio && isPlayableAudioUrl(content) ? (
              <p className="admin-field__hint">
                Fichier actuel :{" "}
                <a href={content} target="_blank" rel="noreferrer">
                  Écouter
                </a>
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="admin-field">
          <label htmlFor="imageUrl">
            {type === "article" ? "Illustration de une (recommandée)" : "Image (URL, optionnel)"}
          </label>
          <input
            id="imageUrl"
            name="imageUrl"
            placeholder="https://... ou import ci-dessous"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>
        <div className="admin-field">
          <label htmlFor="imageUpload">Image (upload, optionnel)</label>
          <input
            id="imageUpload"
            name="imageUpload"
            type="file"
            accept="image/*"
            onChange={onImageFileChange}
            disabled={isUploading}
          />
          {isUploading ? (
            <p className="admin-assistantState">
              <span className="admin-loader" aria-hidden="true" />
              Upload en cours...
            </p>
          ) : null}
          {imageUrl && !isUploading ? (
            <p className="admin-field__hint">
              Image actuelle:{" "}
              <a href={imageUrl} target="_blank" rel="noreferrer">
                voir
              </a>
            </p>
          ) : type === "article" ? (
            <p className="admin-field__hint">
              Une illustration renforce la carte publication dans le catalogue (comme une une de journal).
            </p>
          ) : null}
        </div>
        <div className="admin-field">
          <label htmlFor="tags">Tags</label>
          <input
            id="tags"
            name="tags"
            placeholder="football, analyse, ligue 1"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
          <p className="admin-field__hint">Saisie rapide: separe les tags par des virgules.</p>
          {existingTagSuggestions.length > 0 ? (
            <div className="admin-tagSuggestions" aria-label="Tags déjà utilisés">
              {existingTagSuggestions.map((tag) => {
                const active = tagsInput
                  .split(",")
                  .map((t) => t.trim().toLowerCase())
                  .includes(tag.toLowerCase());
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`admin-tagSuggestion${active ? " is-active" : ""}`}
                    onClick={() => onToggleTagSuggestion(tag)}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="admin-field">
          <label htmlFor="category_id">Catégorie</label>
          <select
            id="category_id"
            name="category_id"
            value={selectedCategoryId}
            onChange={(e) => {
              setSelectedCategoryId(e.target.value);
              setSelectedSubcategoryId("");
            }}
          >
            <option value="">Choisir une catégorie</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-field">
          <label htmlFor="subcategory_id">Rubrique</label>
          <select
            id="subcategory_id"
            name="subcategory_id"
            value={selectedSubcategoryId}
            onChange={(e) => setSelectedSubcategoryId(e.target.value)}
            disabled={!selectedCategoryId}
          >
            <option value="">Choisir une rubrique</option>
            {publishSubcategoryOptions.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
          {selectedCategoryId && !loadingSubcategories && publishSubcategoryOptions.length === 0 ? (
            <p className="admin-field__hint">
              Aucune rubrique dans cette catégorie. Créez-en dans l’onglet <strong>Rubriques</strong>.
            </p>
          ) : (
            <p className="admin-field__hint">
              Vidéos, articles de presse et audio sont rangés dans une rubrique avant publication.
            </p>
          )}
        </div>

        <div className="admin-field">
          <label
            className={`admin-check${contentStatus !== "published" ? " admin-check--disabled" : ""}`}
            htmlFor="contentFeatured"
          >
            <input
              id="contentFeatured"
              type="checkbox"
              checked={isFeatured}
              disabled={contentStatus !== "published"}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            <span>Mettre à la une</span>
          </label>
          <p className="admin-field__hint">
            {contentStatus !== "published"
              ? "Publiez d'abord ce contenu pour le mettre à la une."
              : isFeatured
                ? "Contenu principal : accueil (feature story) et catalogue. Un seul à la fois — l'ancien est retiré automatiquement."
                : "Affiche ce contenu en feature story sur l'accueil et en tête du catalogue."}
          </p>
        </div>

        <div className="admin-field">
          <label htmlFor="contentStatus">Statut</label>
          <select
            id="contentStatus"
            value={contentStatus}
            onChange={(e) => {
              const next = e.target.value as PublicationStatus;
              setContentStatus(next);
              if (next === "draft") {
                setNotifySubscribers(false);
                setIsFeatured(false);
              }
            }}
          >
            <option value="draft">Brouillon — invisible sur le site</option>
            <option value="published">Publié — visible sur le site</option>
          </select>
        </div>

        {contentStatus === "published" ? (
          <div className="admin-field">
            <label className="admin-check" htmlFor="contentNotifySubscribers">
              <input
                id="contentNotifySubscribers"
                type="checkbox"
                checked={notifySubscribers}
                onChange={(e) => setNotifySubscribers(e.target.checked)}
              />
              <span>Informer les abonnés</span>
            </label>
            <p className="admin-field__hint">
              Envoie un email aux abonnés actifs à la publication de ce contenu.
            </p>
          </div>
        ) : null}

        <div className="admin-assistants">
          <button
            type="button"
            className="admin-btn admin-btn--ghost admin-assistantBtn"
            onClick={() => runAssistant("summary")}
            disabled={assistantLoading !== null}
          >
            {assistantLoading === "summary" ? (
              <>
                <span className="admin-loader" aria-hidden="true" />
                Generation...
              </>
            ) : (
              "Generer resume"
            )}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--ghost admin-assistantBtn"
            onClick={() => runAssistant("tags")}
            disabled={assistantLoading !== null}
          >
            {assistantLoading === "tags" ? (
              <>
                <span className="admin-loader" aria-hidden="true" />
                Generation...
              </>
            ) : (
              "Suggérer tags"
            )}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--ghost admin-assistantBtn"
            onClick={() => runAssistant("seo")}
            disabled={assistantLoading !== null}
          >
            {assistantLoading === "seo" ? (
              <>
                <span className="admin-loader" aria-hidden="true" />
                Generation...
              </>
            ) : (
              "Optimiser SEO"
            )}
          </button>
        </div>

        <div className="admin-formActions">
          <button type="submit" className="admin-btn" disabled={isSubmitting || isUploading}>
            {isSubmitting ? (
              <>
                <span className="admin-loader" aria-hidden="true" />
                Envoi...
              </>
            ) : editingContentId ? (
              contentStatus === "published" ? "Enregistrer (publié)" : "Enregistrer le brouillon"
            ) : contentStatus === "published" ? (
              "Publier"
            ) : (
              "Enregistrer le brouillon"
            )}
          </button>
          {editingContentId ? (
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={() => {
                resetForm();
                pushToast("info", "Edition annulee.");
              }}
            >
              Annuler edition
            </button>
          ) : null}
          <span className="admin-formActions__hint" aria-hidden="true">
            <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
          </span>
        </div>
      </form>
    );
  }

  if (activeTab === "contenus") {
    const categoriesById = new Map(categories.map((category) => [category.id, category.name]));
    const subcategoriesById = new Map(subcategories.map((sub) => [sub.id, sub.name]));
    const search = searchTerm.trim().toLowerCase();
    const filteredContents = contents.filter((item) => {
      if (filterType !== "all" && item.type !== filterType) return false;
      if (!search) return true;
      if (item.title.toLowerCase().includes(search)) return true;
      const categoryName = item.category_id ? categoriesById.get(item.category_id)?.toLowerCase() ?? "" : "";
      if (categoryName && categoryName.includes(search)) return true;
      const subName = item.subcategory_id
        ? subcategoriesById.get(item.subcategory_id)?.toLowerCase() ?? ""
        : "";
      if (subName && subName.includes(search)) return true;
      return item.tags.some((tag) => tag.toLowerCase().includes(search));
    });

    /* Comptes par type (toujours calcules sur le dataset complet) */
    const typeCounts = {
      video: contents.filter((c) => c.type === "video").length,
      article: contents.filter((c) => c.type === "article").length,
      audio: contents.filter((c) => c.type === "audio").length,
    };

    const hasFilters = search.length > 0 || filterType !== "all";
    const isEmptyNoFilter = !loadingContents && !hasFilters && !contents.length;
    const isEmptyWithFilter = !loadingContents && hasFilters && !filteredContents.length;

    panel = (
      <div className="admin-list admin-reveal">
        <div className="admin-tools">
          <div className="admin-tools__searchWrap">
            <span className="admin-tools__searchIcon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </span>
            <input
              className="admin-tools__search"
              placeholder="Rechercher un titre ou un tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm ? (
              <button
                type="button"
                className="admin-tools__clear"
                onClick={() => setSearchTerm("")}
                aria-label="Effacer la recherche"
              >
                ×
              </button>
            ) : null}
          </div>
          <select
            className="admin-tools__filter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as "all" | ContentType)}
          >
            <option value="all">Tous les types ({contents.length})</option>
            <option value="video">Vidéo ({typeCounts.video})</option>
            <option value="article">Article ({typeCounts.article})</option>
            <option value="audio">Audio ({typeCounts.audio})</option>
          </select>
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={() => void loadContents()}
            disabled={loadingContents}
          >
            {loadingContents ? (
              <>
                <span className="admin-loader" aria-hidden="true" />
                Chargement
              </>
            ) : (
              "Actualiser"
            )}
          </button>
        </div>

        {!loadingContents ? (
          <p className="admin-list__count">
            {filteredContents.length}{" "}
            {filteredContents.length > 1 ? "contenus" : "contenu"}
            {hasFilters && contents.length ? ` (sur ${contents.length})` : ""}
          </p>
        ) : null}

        {loadingContents ? (
          <div className="admin-skeletonList" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="admin-skeletonRow">
                <div className="admin-skeleton admin-skeleton--title" />
                <div className="admin-skeleton admin-skeleton--meta" />
              </div>
            ))}
          </div>
        ) : null}

        {isEmptyNoFilter ? (
          <div className="admin-emptyState">
            <p>Aucun contenu publié pour le moment.</p>
            <button
              type="button"
              className="admin-btn"
              onClick={() => setActiveTab("publier")}
            >
              Publier le premier contenu
            </button>
          </div>
        ) : null}

        {isEmptyWithFilter ? (
          <div className="admin-emptyState">
            <p>Aucun résultat pour cette recherche.</p>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={() => {
                setSearchTerm("");
                setFilterType("all");
              }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : null}

        {!loadingContents &&
          filteredContents.map((item) => (
            <article key={item.id} className="admin-list__item">
              <div className="admin-list__info">
                <div className="admin-list__row">
                  <span className={`admin-typeBadge admin-typeBadge--${item.type}`}>
                    {typeLabels[item.type]}
                  </span>
                  <time className="admin-list__date" dateTime={item.created_at}>
                    {dateFormatter.format(new Date(item.created_at))}
                  </time>
                </div>
                <p className="admin-list__title">{item.title}</p>
                <div className="admin-list__row">
                  <span
                    className={`admin-statusBadge ${item.status === "draft" ? "admin-statusBadge--draft" : "admin-statusBadge--published"}`}
                  >
                    {publicationStatusLabel(item.status ?? "published")}
                  </span>
                  {item.is_featured ? <span className="admin-typeBadge">À la une</span> : null}
                  {item.category_id ? (
                    <span className="admin-list__tag">
                      {categoriesById.get(item.category_id) ?? "Catégorie"}
                    </span>
                  ) : null}
                  {item.subcategory_id ? (
                    <span className="admin-list__tag">
                      {subcategoriesById.get(item.subcategory_id) ?? "Rubrique"}
                    </span>
                  ) : null}
                </div>
                {item.tags.length ? (
                  <div className="admin-list__tags">
                    {item.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="admin-list__tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="admin-list__actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  onClick={() => onEditContent(item)}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--danger"
                  onClick={() => onDeleteContent(item.id, item.title)}
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))}
      </div>
    );
  }

  if (activeTab === "profil") {
    panel = <ThomasProfileAdminPanel apiFetch={apiFetch} pushToast={pushToast} />;
  }

  if (activeTab === "site") {
    panel = <SiteSettingsAdminPanel apiFetch={apiFetch} pushToast={pushToast} />;
  }

  if (activeTab === "partenaires") {
    panel = <PartnersAdminPanel apiFetch={apiFetch} pushToast={pushToast} />;
  }

  if (activeTab === "agenda") {
    panel = <AgendaAdminPanel apiFetch={apiFetch} pushToast={pushToast} />;
  }

  if (activeTab === "newsletter") {
    panel = <NewsletterAdminPanel apiFetch={apiFetch} pushToast={pushToast} />;
  }

  if (activeTab === "categories") {
    const categoriesById = new Map(categories.map((c) => [c.id, c.name]));
    panel = (
      <div className="admin-reveal">
        <p className="admin-field__hint" style={{ marginBottom: 16 }}>
          Les 4 catégories du catalogue sont fixes : <strong>Radio</strong>, <strong>TV</strong>,{" "}
          <strong>Presse écrite/web</strong> et <strong>Réseaux sociaux</strong>. Créez ici les{" "}
          <strong>rubriques</strong> (sous-catégories) dans chaque catégorie avant de publier dans
          l’onglet <strong>Publier</strong>.
        </p>

        <div className="admin-field">
          <label htmlFor="parentCategoryId">Catégorie parente</label>
          <select
            id="parentCategoryId"
            value={parentCategoryId}
            onChange={(e) => {
              setParentCategoryId(e.target.value);
              if (!editingSubcategoryId) resetSubcategoryForm();
            }}
          >
            <option value="">Choisir une catégorie</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <form className="admin-form" onSubmit={onSubmitSubcategory}>
          <div className="admin-field">
            <label htmlFor="subcategoryName">Nom de la rubrique</label>
            <input
              id="subcategoryName"
              name="subcategoryName"
              placeholder="Reportages, Analyses, Coulisses..."
              value={subcategoryName}
              onChange={(e) => setSubcategoryName(e.target.value)}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="subcategoryDescription">Description</label>
            <textarea
              id="subcategoryDescription"
              name="subcategoryDescription"
              rows={3}
              placeholder="Brève description affichée sur le catalogue"
              value={subcategoryDescription}
              onChange={(e) => setSubcategoryDescription(e.target.value)}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="subcategoryPosition">Position</label>
            <input
              id="subcategoryPosition"
              name="subcategoryPosition"
              type="number"
              min={0}
              step={1}
              placeholder="100"
              value={subcategoryPosition}
              onChange={(e) => setSubcategoryPosition(e.target.value)}
            />
            <p className="admin-field__hint">Plus petit = affiché plus haut dans la catégorie.</p>
          </div>

          <div className="admin-formActions">
            <button type="submit" className="admin-btn" disabled={isSavingSubcategory || !parentCategoryId}>
              {isSavingSubcategory ? (
                <>
                  <span className="admin-loader" aria-hidden="true" />
                  Enregistrement...
                </>
              ) : editingSubcategoryId ? (
                "Mettre à jour"
              ) : (
                "Créer rubrique"
              )}
            </button>
            {editingSubcategoryId ? (
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                onClick={() => {
                  resetSubcategoryForm();
                  pushToast("info", "Édition rubrique annulée.");
                }}
              >
                Annuler édition
              </button>
            ) : null}
          </div>
        </form>

        <div className="admin-list" style={{ marginTop: 18 }}>
          <div className="admin-tools">
            <p className="admin-list__count" style={{ margin: 0 }}>
              {loadingSubcategories
                ? "Chargement..."
                : `${parentSubcategories.length} rubrique${parentSubcategories.length > 1 ? "s" : ""}${
                    parentCategoryId && categoriesById.get(parentCategoryId)
                      ? ` — ${categoriesById.get(parentCategoryId)}`
                      : ""
                  }`}
            </p>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={() => void loadSubcategories()}
              disabled={loadingSubcategories}
            >
              Actualiser
            </button>
          </div>

          {!parentCategoryId ? (
            <div className="admin-emptyState">
              <p>Sélectionnez une catégorie pour gérer ses rubriques.</p>
            </div>
          ) : null}

          {parentCategoryId && !loadingSubcategories && parentSubcategories.length === 0 ? (
            <div className="admin-emptyState">
              <p>Aucune rubrique dans cette catégorie.</p>
            </div>
          ) : null}

          {!loadingSubcategories &&
            parentSubcategories.map((item) => (
              <article key={item.id} className="admin-list__item">
                <div className="admin-list__info">
                  <div className="admin-list__row">
                    <span className="admin-typeBadge">Rubrique</span>
                    <span className="admin-list__tag">Pos. {item.position ?? 100}</span>
                    <time className="admin-list__date" dateTime={item.created_at}>
                      {dateFormatter.format(new Date(item.created_at))}
                    </time>
                  </div>
                  <p className="admin-list__title">{item.name}</p>
                  {item.description ? <p className="admin-list__meta">{item.description}</p> : null}
                </div>
                <div className="admin-list__actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    onClick={() => onEditSubcategory(item)}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--danger"
                    onClick={() => void onDeleteSubcategory(item)}
                  >
                    Supprimer
                  </button>
                </div>
              </article>
            ))}
        </div>
      </div>
    );
  }

  return (
    <section className="admin-page">
      <div className="container admin-layout">
        <aside className="admin-nav admin-reveal">
          <p className="admin-nav__title">Admin</p>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`admin-tab ${activeTab === tab.id ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </aside>

        <article className="admin-panel">
          <header className="admin-panel__head admin-reveal">
            <p className="home-sectionEyebrow">Interface journaliste</p>
            <h1 className="admin-title">{tabTitles[activeTab]}</h1>
          </header>
          <div ref={panelRef}>{panel}</div>
        </article>
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </section>
  );
}

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const latest = el.lastElementChild as HTMLElement | null;
    if (!latest) return;
    if (isReducedMotion()) {
      gsap.set(latest, { opacity: 1, y: 0, scale: 1 });
      return;
    }
    gsap.fromTo(
      latest,
      { opacity: 0, y: -8, scale: 0.98 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: motion.duration.micro,
        ease: motion.ease.outSoft,
      }
    );
  }, [toasts.length]);

  return (
    <div ref={wrapperRef} className="admin-toastStack" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`admin-toast admin-toast--${t.kind}`}
        >
          <span className="admin-toast__icon" aria-hidden="true">
            {t.kind === "success" ? "✓" : t.kind === "error" ? "!" : "i"}
          </span>
          <span className="admin-toast__msg">{t.message}</span>
          {t.action ? (
            <button
              type="button"
              className="admin-toast__action"
              onClick={() => {
                t.action?.onClick();
                onDismiss(t.id);
              }}
            >
              {t.action.label}
            </button>
          ) : null}
          <button
            type="button"
            className="admin-toast__close"
            aria-label="Fermer la notification"
            onClick={() => onDismiss(t.id)}
          >
            ×
          </button>
          {t.duration > 0 ? (
            <span
              className="admin-toast__progress"
              style={{ animationDuration: `${t.duration}ms` }}
              aria-hidden="true"
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}
