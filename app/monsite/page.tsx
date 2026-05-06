"use client";

import gsap from "gsap";
import { isReducedMotion, motion } from "../../lib/gsapMotion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import type { Content, ContentType } from "../../types/content";
import type { Category } from "../../types/category";

type AdminTab = "dashboard" | "publier" | "contenus" | "categories" | "profil";
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
  { id: "contenus", label: "Mes contenus" },
  { id: "categories", label: "Catégories" },
  { id: "profil", label: "Profil" },
];

const typeLabels: Record<ContentType, string> = {
  video: "Vidéo",
  article: "Article",
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
  const [tagsInput, setTagsInput] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
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
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryPosition, setCategoryPosition] = useState("100");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);

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
        window.setTimeout(() => router.replace("/login?redirect=/monsite"), 900);
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
        const response = await apiFetch("/api/content", { cache: "no-store" });
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
        pushToast("error", "Erreur reseau pendant le chargement.");
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
        setCategories(Array.isArray(result.data) ? result.data : []);
      } catch {
        pushToast("error", "Erreur reseau pendant le chargement des categories.");
        setCategories([]);
      } finally {
        if (!opts?.silent) setLoadingCategories(false);
      }
    },
    [apiFetch, pushToast]
  );

  const loadProfile = useCallback(async () => {
    try {
      const response = await apiFetch("/api/profile", { cache: "no-store" });
      const result = (await response.json()) as { data?: { image_url?: string }; error?: string };
      if (!response.ok) {
        if (response.status !== 401) {
          pushToast("error", result.error ?? "Impossible de charger le profil.");
        }
        return;
      }
      setProfileImageUrl(typeof result.data?.image_url === "string" ? result.data.image_url : "");
    } catch {
      pushToast("error", "Erreur reseau pendant le chargement du profil.");
    }
  }, [apiFetch, pushToast]);

  useEffect(() => {
    if (activeTab === "contenus" || activeTab === "dashboard") {
      void loadContents({ silent: activeTab === "dashboard" });
    }
  }, [activeTab, loadContents]);

  useEffect(() => {
    if (
      activeTab === "categories" ||
      activeTab === "dashboard" ||
      activeTab === "publier" ||
      activeTab === "contenus"
    ) {
      void loadCategories({ silent: activeTab === "dashboard" });
    }
  }, [activeTab, loadCategories]);

  useEffect(() => {
    if (activeTab === "profil" || activeTab === "dashboard") {
      void loadProfile();
    }
  }, [activeTab, loadProfile]);

  async function uploadFile(file: File): Promise<{ kind: "image" | "audio"; url: string } | null> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiFetch("/api/upload", { method: "POST", body: formData });
    const result = (await response.json()) as {
      data?: { kind?: "image" | "audio"; url?: string };
      error?: string;
    };
    if (!response.ok || !result.data?.url || !result.data.kind) {
      if (response.status !== 401) {
        pushToast("error", result.error ?? "Upload impossible.");
      }
      return null;
    }
    return { kind: result.data.kind, url: result.data.url };
  }

  async function onImageFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const result = await uploadFile(file);
      if (result?.kind === "image") {
        setImageUrl(result.url);
        pushToast("success", "Image uploadee.");
      } else if (result) {
        pushToast("error", "Ce champ accepte uniquement une image.");
      }
    } catch {
      pushToast("error", "Erreur reseau pendant l'upload.");
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
      const result = await uploadFile(file);
      if (result?.kind === "audio") {
        setContent(result.url);
        pushToast("success", "Audio uploade.");
      } else if (result) {
        pushToast("error", "Ce champ accepte uniquement un audio.");
      }
    } catch {
      pushToast("error", "Erreur reseau pendant l'upload.");
    } finally {
      setIsUploadingAudio(false);
      event.target.value = "";
    }
  }

  async function onProfileImageFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingProfileImage(true);
    try {
      const result = await uploadFile(file);
      if (result?.kind === "image") {
        setProfileImageUrl(result.url);
        pushToast("success", "Photo de profil uploadée.");
      } else if (result) {
        pushToast("error", "Ce champ accepte uniquement une image.");
      }
    } catch {
      pushToast("error", "Erreur reseau pendant l'upload.");
    } finally {
      setIsUploadingProfileImage(false);
      event.target.value = "";
    }
  }

  async function onSaveProfile() {
    setIsSavingProfile(true);
    try {
      const response = await apiFetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: profileImageUrl.trim() }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        if (response.status !== 401) {
          pushToast("error", result.error ?? "Impossible de mettre à jour le profil.");
        }
        return;
      }
      pushToast("success", "Photo du journaliste mise à jour.");
      void loadProfile();
    } catch {
      pushToast("error", "Erreur reseau pendant la mise à jour.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  function resetForm() {
    setTitle("");
    setTitleError(false);
    setType("video");
    setContent("");
    setImageUrl("");
    setSelectedCategoryId("");
    setTagsInput("");
    setIsFeatured(false);
    setEditingContentId(null);
  }

  function resetCategoryForm() {
    setCategoryName("");
    setCategoryDescription("");
    setCategoryPosition("100");
    setEditingCategoryId(null);
  }

  // Supprime l'erreur de titre des que l'utilisateur corrige
  useEffect(() => {
    if (titleError && title.trim()) setTitleError(false);
  }, [title, titleError]);

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
          content: content.trim(),
          image_url: imageUrl.trim(),
          category_id: selectedCategoryId || null,
          tags,
          is_featured: isFeatured,
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
      pushToast("error", "Erreur reseau. Reessaie.");
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
        pushToast("error", "Erreur reseau pendant la suppression.");
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
    setTagsInput(item.tags.join(", "));
    setIsFeatured(Boolean(item.is_featured));
    pushToast("info", "Mode edition: modifie puis valide.");
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function onEditCategory(item: Category) {
    setCategoryName(item.name);
    setCategoryDescription(item.description ?? "");
    setCategoryPosition(String(item.position ?? 100));
    setEditingCategoryId(item.id);
    pushToast("info", "Mode edition categorie actif.");
  }

  async function onDeleteCategory(item: Category) {
    if (typeof window !== "undefined" && !window.confirm(`Supprimer la categorie "${item.name}" ?`)) return;
    try {
      const response = await apiFetch(`/api/categories/${item.id}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        if (response.status !== 401) {
          pushToast("error", result.error ?? "Suppression impossible.");
        }
        return;
      }
      pushToast("success", `Categorie supprimee : ${item.name}`);
      if (editingCategoryId === item.id) resetCategoryForm();
      void loadCategories({ silent: true });
    } catch {
      pushToast("error", "Erreur reseau pendant la suppression.");
    }
  }

  async function onSubmitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = categoryName.trim();
    if (!name) {
      pushToast("error", "Le nom de la categorie est obligatoire.");
      return;
    }

    setIsSavingCategory(true);
    try {
      const isEditing = Boolean(editingCategoryId);
      const endpoint = isEditing ? `/api/categories/${editingCategoryId}` : "/api/categories";
      const method = isEditing ? "PUT" : "POST";
      const response = await apiFetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: categoryDescription.trim(),
          position: Number.isFinite(Number(categoryPosition)) ? Number(categoryPosition) : 100,
        }),
      });
      const result = (await response.json()) as { error?: string; data?: { name?: string } };
      if (!response.ok) {
        if (response.status !== 401) {
          pushToast("error", result.error ?? "Echec de l'enregistrement de la categorie.");
        }
        return;
      }

      pushToast(
        "success",
        isEditing
          ? `Categorie modifiee : ${result.data?.name ?? name}`
          : `Categorie creee : ${result.data?.name ?? name}`
      );
      resetCategoryForm();
      void loadCategories({ silent: true });
    } catch {
      pushToast("error", "Erreur reseau. Reessaie.");
    } finally {
      setIsSavingCategory(false);
    }
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
    const total = contents.length;
    const videos = contents.filter((c) => c.type === "video").length;
    const articles = contents.filter((c) => c.type === "article").length;
    const audios = contents.filter((c) => c.type === "audio").length;
    const stats: { label: string; value: number | string }[] = [
      { label: "Contenus publies", value: loadingContents ? "--" : total },
      { label: "Vidéos", value: loadingContents ? "--" : videos },
      { label: "Articles", value: loadingContents ? "--" : articles },
      { label: "Audios", value: loadingContents ? "--" : audios },
    ];

    panel = (
      <div className="admin-grid admin-reveal">
        {stats.map((stat) => (
          <article key={stat.label} className="admin-card">
            <p className="admin-card__label">{stat.label}</p>
            {loadingContents ? (
              <span className="admin-skeleton admin-skeleton--value" aria-hidden="true" />
            ) : (
              <p className="admin-card__value">{stat.value}</p>
            )}
          </article>
        ))}
      </div>
    );
  }

  if (activeTab === "publier") {
    const hasCategories = categories.length > 0;
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
            <option value="article">Article</option>
            <option value="audio">Audio</option>
          </select>
        </div>
        <div className="admin-field">
          <label htmlFor="content">
            {type === "article"
              ? "Contenu texte"
              : type === "video"
              ? "Lien vidéo (YouTube, Vimeo…)"
              : "Lien audio ou URL publique"}
          </label>
          <textarea
            id="content"
            name="content"
            rows={type === "article" ? 5 : 3}
            placeholder={type === "article" ? "Ecris ton article..." : "https://..."}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
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
            {content && !isUploadingAudio && /^https?:\/\//i.test(content) ? (
              <p className="admin-field__hint">
                Fichier actuel:{" "}
                <a href={content} target="_blank" rel="noreferrer">
                  ecouter
                </a>
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="admin-field">
          <label htmlFor="imageUrl">Image (URL)</label>
          <input
            id="imageUrl"
            name="imageUrl"
            placeholder="https://... ou import ci-dessous"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>
        <div className="admin-field">
          <label htmlFor="imageUpload">Image (upload)</label>
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
        </div>

        <div className="admin-field">
          <label htmlFor="category_id">Catégorie</label>
          <select
            id="category_id"
            name="category_id"
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
          >
            <option value="">Sans catégorie</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {!loadingCategories && !hasCategories ? (
            <p className="admin-field__hint">
              Aucune catégorie disponible. Crée-les dans l’onglet Catégories.
            </p>
          ) : null}
        </div>

        <div className="admin-field">
          <label htmlFor="is_featured">Mise en avant</label>
          <button
            id="is_featured"
            type="button"
            className={`admin-btn ${isFeatured ? "" : "admin-btn--ghost"}`}
            onClick={() => setIsFeatured((prev) => !prev)}
            aria-pressed={isFeatured}
          >
            {isFeatured ? "Retirer de la une" : "Mettre à la une"}
          </button>
          <p className="admin-field__hint">
            {isFeatured
              ? "Ce contenu remontera dans les sélections à la une."
              : "Active ce bouton pour mettre ce contenu en avant."}
          </p>
        </div>
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
              "Mettre a jour"
            ) : (
              "Publier"
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
    const search = searchTerm.trim().toLowerCase();
    const filteredContents = contents.filter((item) => {
      if (filterType !== "all" && item.type !== filterType) return false;
      if (!search) return true;
      if (item.title.toLowerCase().includes(search)) return true;
      const categoryName = item.category_id ? categoriesById.get(item.category_id)?.toLowerCase() ?? "" : "";
      if (categoryName && categoryName.includes(search)) return true;
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
                  {item.is_featured ? <span className="admin-typeBadge">À la une</span> : null}
                  {item.category_id ? (
                    <span className="admin-list__tag">
                      {categoriesById.get(item.category_id) ?? "Catégorie"}
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
    panel = (
      <div className="admin-profile admin-reveal">
        <p>
          <strong>Nom:</strong> Thomas Palmier
        </p>
        <p>
          <strong>Email:</strong> contact@sportjournal.fr
        </p>
        <p>
          <strong>Ligne éditoriale:</strong> Analyse, terrain, formats courts.
        </p>
        <div className="admin-field">
          <label htmlFor="profileImageUrl">Photo du journaliste (URL)</label>
          <input
            id="profileImageUrl"
            name="profileImageUrl"
            placeholder="https://... ou upload ci-dessous"
            value={profileImageUrl}
            onChange={(e) => setProfileImageUrl(e.target.value)}
          />
        </div>
        <div className="admin-field">
          <label htmlFor="profileImageUpload">Photo du journaliste (upload)</label>
          <input
            id="profileImageUpload"
            name="profileImageUpload"
            type="file"
            accept="image/*"
            onChange={onProfileImageFileChange}
            disabled={isUploadingProfileImage}
          />
          {isUploadingProfileImage ? (
            <p className="admin-assistantState">
              <span className="admin-loader" aria-hidden="true" />
              Upload en cours...
            </p>
          ) : null}
          {profileImageUrl ? (
            <p className="admin-field__hint">
              Photo actuelle:{" "}
              <a href={profileImageUrl} target="_blank" rel="noreferrer">
                voir
              </a>
            </p>
          ) : null}
        </div>
        <button type="button" className="admin-btn" onClick={() => void onSaveProfile()} disabled={isSavingProfile}>
          {isSavingProfile ? (
            <>
              <span className="admin-loader" aria-hidden="true" />
              Mise à jour...
            </>
          ) : (
            "Mettre à jour"
          )}
        </button>
      </div>
    );
  }

  if (activeTab === "categories") {
    panel = (
      <div className="admin-reveal">
        <p className="admin-field__hint" style={{ marginBottom: 16 }}>
          Les catégories créées ici sont proposées dans l’onglet <strong>Publier</strong> et filtrables sur la page
          publique <strong>Mes contenus</strong>. Pour un texte long, choisissez le type <strong>Article</strong>.
        </p>
        <form className="admin-form" onSubmit={onSubmitCategory}>
          <div className="admin-field">
            <label htmlFor="categoryName">Nom de la catégorie</label>
            <input
              id="categoryName"
              name="categoryName"
              placeholder="Analyse, Enquête, Reportage..."
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="categoryDescription">Description</label>
            <textarea
              id="categoryDescription"
              name="categoryDescription"
              rows={3}
              placeholder="Brève description éditoriale"
              value={categoryDescription}
              onChange={(e) => setCategoryDescription(e.target.value)}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="categoryPosition">Position éditoriale</label>
            <input
              id="categoryPosition"
              name="categoryPosition"
              type="number"
              min={0}
              step={1}
              placeholder="100"
              value={categoryPosition}
              onChange={(e) => setCategoryPosition(e.target.value)}
            />
            <p className="admin-field__hint">Plus petit = plus haut sur la homepage.</p>
          </div>

          <div className="admin-formActions">
            <button type="submit" className="admin-btn" disabled={isSavingCategory}>
              {isSavingCategory ? (
                <>
                  <span className="admin-loader" aria-hidden="true" />
                  Enregistrement...
                </>
              ) : editingCategoryId ? (
                "Mettre à jour"
              ) : (
                "Créer catégorie"
              )}
            </button>
            {editingCategoryId ? (
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                onClick={() => {
                  resetCategoryForm();
                  pushToast("info", "Edition categorie annulee.");
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
              {loadingCategories
                ? "Chargement..."
                : `${categories.length} ${categories.length > 1 ? "catégories" : "catégorie"}`}
            </p>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={() => void loadCategories()}
              disabled={loadingCategories}
            >
              Actualiser
            </button>
          </div>

          {!loadingCategories && !categories.length ? (
            <div className="admin-emptyState">
              <p>Aucune catégorie pour le moment.</p>
            </div>
          ) : null}

          {!loadingCategories &&
            categories.map((item) => (
              <article key={item.id} className="admin-list__item">
                <div className="admin-list__info">
                  <div className="admin-list__row">
                    <span className="admin-typeBadge">Catégorie</span>
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
                    onClick={() => onEditCategory(item)}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--danger"
                    onClick={() => void onDeleteCategory(item)}
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
            <h1 className="admin-title">{tabs.find((tab) => tab.id === activeTab)?.label}</h1>
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
