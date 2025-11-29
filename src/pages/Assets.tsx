import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Info, Plus, ChevronDown, Wallet, Home as HomeIcon, TrendingUp, HandCoins, Lightbulb, X, Check, Pencil, AlertCircle, ArrowUpDown, Trash2, CheckCircle2, Circle } from '@/components/networth/new-ui/Icons';
import { AssetDetailView, AssetItem } from '@/components/assets/new-ui/AssetDetailView';
import { useNavigate } from 'react-router-dom';
import { useNetWorth } from '@/hooks/useNetWorth';
import BottomNav from "@/components/BottomNav";

interface CategoryData {
  id: string;
  title: string;
  icon: any;
  items: AssetItem[];
}

interface AssetFormData {
  name: string;
  category: string;
  amount: string;
  tag: string;
}

type SortOption = 'value_desc' | 'value_asc' | 'name' | 'tag';

// Styling configuration for categories
const CATEGORY_STYLES: Record<string, { gradient: string; tag: string; icon: any }> = {
  'Activos líquidos': {
    gradient: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600',
    tag: 'text-blue-600 bg-blue-50 border border-blue-100',
    icon: Wallet
  },
  'Activos fijos': {
    gradient: 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600',
    tag: 'text-purple-600 bg-purple-50 border border-purple-100',
    icon: HomeIcon
  },
  'Activos financieros': {
    gradient: 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600',
    tag: 'text-emerald-600 bg-emerald-50 border border-emerald-100',
    icon: TrendingUp
  },
  'Activos por cobrar': {
    gradient: 'bg-gradient-to-br from-orange-50 to-orange-100 text-orange-600',
    tag: 'text-orange-600 bg-orange-50 border border-orange-100',
    icon: HandCoins
  },
  'Activos intangibles': {
    gradient: 'bg-gradient-to-br from-pink-50 to-pink-100 text-pink-600',
    tag: 'text-pink-600 bg-pink-50 border border-pink-100',
    icon: Lightbulb
  }
};

const Assets: React.FC = () => {
  const navigate = useNavigate();
  const { data: netWorthData } = useNetWorth('1Y');

  // Initial Data State - Mapped from useNetWorth if available, otherwise default structure
  const [categories, setCategories] = useState<CategoryData[]>([
    { id: 'liquid', title: 'Activos líquidos', icon: Wallet, items: [] },
    { id: 'fixed', title: 'Activos fijos', icon: HomeIcon, items: [] },
    { id: 'financial', title: 'Activos financieros', icon: TrendingUp, items: [] },
    { id: 'receivable', title: 'Activos por cobrar', icon: HandCoins, items: [] },
    { id: 'intangible', title: 'Activos intangibles', icon: Lightbulb, items: [] }
  ]);

  // Effect to populate categories from netWorthData
  useEffect(() => {
    if (netWorthData?.assets) {
      const newCategories = [
        { id: 'liquid', title: 'Activos líquidos', icon: Wallet, items: [] as AssetItem[] },
        { id: 'fixed', title: 'Activos fijos', icon: HomeIcon, items: [] as AssetItem[] },
        { id: 'financial', title: 'Activos financieros', icon: TrendingUp, items: [] as AssetItem[] },
        { id: 'receivable', title: 'Activos por cobrar', icon: HandCoins, items: [] as AssetItem[] },
        { id: 'intangible', title: 'Activos intangibles', icon: Lightbulb, items: [] as AssetItem[] }
      ];

      netWorthData.assets.forEach(asset => {
        const catIndex = newCategories.findIndex(c => c.title === asset.categoria);
        if (catIndex !== -1) {
          newCategories[catIndex].items.push({
            id: asset.id,
            name: asset.nombre,
            tag: asset.subcategoria || asset.categoria,
            value: Number(asset.valor)
          });
        }
      });
      setCategories(newCategories);
    }
  }, [netWorthData]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('liquid');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Track editing state: which asset (ID) and from which category (ID)
  const [editingAsset, setEditingAsset] = useState<{ itemId: string, categoryId: string } | null>(null);

  // Track detailed view state
  const [viewingAsset, setViewingAsset] = useState<{ item: AssetItem, categoryId: string } | null>(null);

  const [isSuccess, setIsSuccess] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // Sorting State
  const [sortOption, setSortOption] = useState<SortOption>('value_desc');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  // Bulk Edit / Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState<AssetFormData>({
    name: '',
    category: 'Activos líquidos',
    amount: '',
    tag: ''
  });

  const [errors, setErrors] = useState<{ name?: string; amount?: string; tag?: string }>({});

  // Refs for smooth scrolling
  const categoryTabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Effect to scroll active category into view
  useEffect(() => {
    const activeIndex = categories.findIndex(c => c.id === selectedCategoryId);
    if (activeIndex !== -1 && categoryTabsRef.current[activeIndex]) {
      categoryTabsRef.current[activeIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [selectedCategoryId, categories]);

  // Derived State: Calculate totals dynamically
  const totalAssetsValue = useMemo(() => {
    return categories.reduce((total, cat) => {
      return total + cat.items.reduce((catTotal, item) => catTotal + item.value, 0);
    }, 0);
  }, [categories]);

  const activeCategoryIndex = categories.findIndex(c => c.id === selectedCategoryId);
  const activeCategory = activeCategoryIndex >= 0 ? categories[activeCategoryIndex] : categories[0];

  // Sort logic
  const sortedItems = useMemo(() => {
    const items = [...activeCategory.items];
    switch (sortOption) {
      case 'value_desc':
        return items.sort((a, b) => b.value - a.value);
      case 'value_asc':
        return items.sort((a, b) => a.value - b.value);
      case 'name':
        return items.sort((a, b) => a.name.localeCompare(b.name));
      case 'tag':
        return items.sort((a, b) => a.tag.localeCompare(b.tag));
      default:
        return items;
    }
  }, [activeCategory.items, sortOption]);

  // Bulk Edit Logic
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set()); // Reset selection on toggle
    setIsSortMenuOpen(false);
  };

  const toggleAssetSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const deleteSelectedAssets = () => {
    if (selectedIds.size === 0) return;

    if (window.confirm(`¿Estás seguro de eliminar ${selectedIds.size} activo(s)?`)) {
      setCategories(prevCategories => {
        return prevCategories.map(cat => {
          if (cat.id === activeCategory.id) {
            return {
              ...cat,
              items: cat.items.filter(item => !selectedIds.has(item.id))
            };
          }
          return cat;
        });
      });
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    }
  };

  // Helper to format currency
  const formatMoney = (value: number) => {
    return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatShortMoney = (value: number) => {
    if (value >= 1000000) return '$' + (value / 1000000).toFixed(2) + 'M';
    if (value >= 1000) return '$' + (value / 1000).toFixed(0) + 'k';
    return '$' + value.toLocaleString('en-US');
  };

  const openNewAssetModal = () => {
    if (isSelectionMode) return;
    setFormData({
      name: '',
      category: activeCategory.title,
      amount: '',
      tag: ''
    });
    setEditingAsset(null);
    setErrors({});
    setIsSuccess(false);
    setIsCategoryOpen(false);
    setIsModalOpen(true);
  };

  const openEditModal = (item: AssetItem, categoryId: string, categoryTitle: string) => {
    if (isSelectionMode) return;
    setFormData({
      name: item.name,
      category: categoryTitle,
      amount: item.value.toLocaleString('en-US', { maximumFractionDigits: 2 }), // Just the number with commas
      tag: item.tag
    });
    setEditingAsset({ itemId: item.id, categoryId });
    setErrors({});
    setIsSuccess(false);
    setIsCategoryOpen(false);
    setIsModalOpen(true);
  };

  const handleDetailViewEdit = (item: AssetItem) => {
    // Determine category if viewingAsset is set
    const categoryId = viewingAsset?.categoryId || selectedCategoryId;
    // Find category title
    const cat = categories.find(c => c.id === categoryId);
    if (cat) {
      openEditModal(item, categoryId, cat.title);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('');
    }

    // Clear error when user types
    if (errors.amount) setErrors(prev => ({ ...prev, amount: undefined }));

    if (val === '') {
      setFormData({ ...formData, amount: '' });
      return;
    }
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? parts[1] : null;
    const formattedInteger = integerPart ? parseInt(integerPart, 10).toLocaleString('en-US') : '0';
    let finalVal = formattedInteger;
    if (decimalPart !== null) {
      finalVal += '.' + decimalPart;
    }
    setFormData({ ...formData, amount: finalVal });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: { name?: string; amount?: string; tag?: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }

    if (!formData.tag.trim()) {
      newErrors.tag = 'La etiqueta es obligatoria';
    }

    const numericValue = parseFloat(formData.amount.replace(/,/g, ''));
    if (!formData.amount || isNaN(numericValue) || numericValue <= 0) {
      newErrors.amount = 'Ingresa un monto mayor a 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newAssetItem: AssetItem = {
      id: editingAsset ? editingAsset.itemId : Date.now().toString(),
      name: formData.name,
      tag: formData.tag,
      value: numericValue
    };

    setCategories(prevCategories => {
      // Deep copy to avoid mutation issues
      const newCategories = prevCategories.map(cat => ({
        ...cat,
        items: [...cat.items]
      }));

      // If Editing: Remove from old category first
      if (editingAsset) {
        const oldCatIndex = newCategories.findIndex(c => c.id === editingAsset.categoryId);
        if (oldCatIndex !== -1) {
          newCategories[oldCatIndex].items = newCategories[oldCatIndex].items.filter(i => i.id !== editingAsset.itemId);
        }
      }

      // Add to new/target category
      const targetCatIndex = newCategories.findIndex(c => c.title === formData.category);
      if (targetCatIndex !== -1) {
        newCategories[targetCatIndex].items.push(newAssetItem);
      }

      return newCategories;
    });

    // If we are in detailed view, update the viewed asset state to reflect changes
    if (viewingAsset && editingAsset && viewingAsset.item.id === editingAsset.itemId) {
      setViewingAsset({
        item: newAssetItem,
        categoryId: viewingAsset.categoryId
      });

      const currentViewingCat = categories.find(c => c.id === viewingAsset.categoryId);

      if (currentViewingCat && currentViewingCat.title !== formData.category) {
        setViewingAsset(null); // Close detail view if moved to another category
      }
    }

    // Show success animation
    setIsSuccess(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsSuccess(false);
    }, 1500);
  };

  const currentCategoryObj = CATEGORY_STYLES[formData.category] ? { ...CATEGORY_STYLES[formData.category], title: formData.category } : null;

  // Render Detailed View if active
  if (viewingAsset) {
    const cat = categories.find(c => c.id === viewingAsset.categoryId);
    const style = cat ? CATEGORY_STYLES[cat.title] : CATEGORY_STYLES['Activos líquidos'];

    return (
      <AssetDetailView
        asset={viewingAsset.item}
        categoryTitle={cat?.title || ''}
        categoryIcon={style?.icon || Wallet}
        categoryGradient={style?.gradient || ''}
        onBack={() => setViewingAsset(null)}
        onEdit={handleDetailViewEdit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-24 animate-fade-in relative" onClick={() => {
      // Close sort menu when clicking outside
      if (isSortMenuOpen) setIsSortMenuOpen(false);
    }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FAFAF9]/95 backdrop-blur-sm px-6 pt-6 pb-2">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/net-worth')}
            className="w-10 h-10 bg-white rounded-full shadow-soft flex items-center justify-center text-moni-dark hover:bg-gray-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-moni-dark text-lg font-bold leading-tight">Activos</h1>
            <p className="text-gray-400 text-xs">Recursos que posees</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full">
        {/* Info Card */}
        <div className="mx-6 bg-white rounded-3xl p-6 shadow-soft mb-6 mt-4">
          <h2 className="text-lg font-bold text-moni-dark mb-3">¿Qué son los Activos?</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            Son los recursos que posees y que se pueden convertir en dinero. Incluyen bienes raíces, dinero en efectivo, inversiones, vehículos, joyas, arte y cuentas de jubilación.
          </p>
          <div className="flex gap-3 items-start">
            <Info className="text-gray-400 w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="text-gray-400 text-xs leading-relaxed">
              Los activos se clasifican en líquidos, fijos, financieros, por cobrar e intangibles.
            </p>
          </div>
        </div>

        {/* Total Assets Card - Compact */}
        <div className="mx-6 bg-white rounded-2xl py-5 px-6 shadow-soft mb-5 flex flex-col justify-center">
          <p className="text-gray-400 text-xs font-medium mb-1">Total de Activos</p>
          <h3 className="text-3xl font-bold text-emerald-700 tracking-tight">{formatMoney(totalAssetsValue)}</h3>
        </div>

        {/* Categories Header & Controls */}
        <div className="mx-6 flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-moni-dark">Categorías de Activos</h3>
          <button
            onClick={openNewAssetModal}
            disabled={isSelectionMode}
            className={`bg-moni-brown/10 text-moni-brown px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-bold transition-all active:scale-95 hover:bg-moni-brown/20 ${isSelectionMode ? 'opacity-30' : 'opacity-100'}`}
          >
            <Plus size={12} strokeWidth={3} /> Nuevo
          </button>
        </div>

        {/* Horizontal Carousel - Compact */}
        <div className="flex overflow-x-auto gap-3 px-6 pb-6 snap-x no-scrollbar -mx-6 md:mx-0 md:px-6">
          {categories.map((cat, index) => {
            const isSelected = selectedCategoryId === cat.id;
            const style = CATEGORY_STYLES[cat.title];
            const catTotal = cat.items.reduce((sum, item) => sum + item.value, 0);
            const count = cat.items.length;

            return (
              <button
                key={cat.id}
                ref={(el) => { categoryTabsRef.current[index] = el; }}
                onClick={() => {
                  if (!isSelectionMode) setSelectedCategoryId(cat.id);
                }}
                className={`
                  relative min-w-[160px] snap-center text-left
                  rounded-2xl p-4 transition-all duration-300
                  flex flex-col justify-between gap-2
                  border
                  ${isSelected
                    ? 'bg-white border-moni-brown shadow-float scale-100 z-10'
                    : 'bg-white border-transparent shadow-soft opacity-80 scale-[0.98] hover:opacity-100 hover:scale-100 hover:shadow-md'
                  }
                  ${isSelectionMode && !isSelected ? 'opacity-40 grayscale' : ''}
                `}
              >
                <div className="flex justify-between items-start">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-300 ${isSelected ? 'scale-110' : 'scale-100'} ${style?.gradient || 'bg-gray-100'}`}>
                    {style?.icon && <style.icon size={16} fill="currentColor" fillOpacity={0.2} />}
                  </div>
                  <div className="text-right">
                    <span className={`block font-bold text-sm transition-colors duration-300 ${isSelected ? 'text-moni-dark' : 'text-gray-400'}`}>
                      {formatShortMoney(catTotal)}
                    </span>
                  </div>
                </div>

                <div>
                  <p className={`font-bold text-xs transition-colors duration-300 truncate ${isSelected ? 'text-moni-dark' : 'text-gray-600'}`}>
                    {cat.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-gray-400 text-[9px]">
                      {count} {count === 1 ? 'cuenta' : 'cuentas'}
                    </p>
                    {count === 0 && (
                      <span className="bg-gray-100 text-gray-500 text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                        Sin datos
                      </span>
                    )}
                  </div>
                </div>

                {/* Active Indicator with smooth transition */}
                <div
                  className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-moni-brown rounded-full transition-all duration-300 ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
                />
              </button>
            );
          })}
          {/* Spacer for end of list scrolling */}
          <div className="w-2 flex-shrink-0" />
        </div>

        {/* Selected Category Items List */}
        <div className="mx-6 mt-2 relative">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Detalles de {activeCategory.title}
            </h4>

            <div className="flex gap-2">
              {/* Select / Cancel Selection Button */}
              {sortedItems.length > 0 && (
                <button
                  onClick={toggleSelectionMode}
                  className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full transition-all active:scale-95 ${isSelectionMode ? 'text-moni-dark bg-gray-200' : 'text-gray-400 hover:text-moni-brown bg-gray-50 hover:bg-gray-100'}`}
                >
                  {isSelectionMode ? <X size={12} /> : <CheckCircle2 size={12} />}
                  {isSelectionMode ? 'Cancelar' : 'Seleccionar'}
                </button>
              )}

              {/* Sort Dropdown */}
              {!isSelectionMode && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSortMenuOpen(!isSortMenuOpen);
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-moni-brown bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded-full transition-all active:scale-95"
                  >
                    <ArrowUpDown size={12} />
                    Ordenar
                  </button>

                  {isSortMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-float border border-gray-100 py-1 z-20 overflow-hidden animate-fade-in origin-top-right">
                      {[
                        { id: 'value_desc', label: 'Mayor valor' },
                        { id: 'value_asc', label: 'Menor valor' },
                        { id: 'name', label: 'Nombre (A-Z)' },
                        { id: 'tag', label: 'Etiqueta' }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setSortOption(opt.id as SortOption);
                            setIsSortMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-gray-50 transition-colors ${sortOption === opt.id ? 'text-moni-brown bg-orange-50' : 'text-gray-500'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Empty State or List */}
          {sortedItems.length > 0 ? (
            <div key={activeCategory.id} className="space-y-3 pb-24">
              {sortedItems.map((item, index) => {
                const style = CATEGORY_STYLES[activeCategory.title];
                const Icon = style?.icon || Wallet;
                const isSelected = selectedIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isSelectionMode) {
                        toggleAssetSelection(item.id);
                      } else {
                        setViewingAsset({ item, categoryId: activeCategory.id });
                      }
                    }}
                    className={`bg-white rounded-2xl p-4 shadow-soft flex items-center group animate-fade-in transition-all duration-300 cursor-pointer active:scale-[0.98] relative overflow-hidden ${isSelectionMode && isSelected ? 'ring-2 ring-moni-brown ring-offset-1 bg-orange-50/30' : ''}`}
                    style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
                  >

                    {/* Selection Checkbox */}
                    <div className={`mr-0 overflow-hidden transition-all duration-300 flex items-center justify-center ${isSelectionMode ? 'w-8 opacity-100 mr-2' : 'w-0 opacity-0'}`}>
                      {isSelected ? (
                        <CheckCircle2 className="text-moni-brown fill-white" size={24} />
                      ) : (
                        <Circle className="text-gray-300" size={24} />
                      )}
                    </div>

                    {/* Content Container */}
                    <div className="flex-1 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${style?.gradient || 'bg-gray-100 text-gray-500'} ${isSelectionMode ? 'scale-90' : 'scale-100'}`}>
                          <Icon size={20} fill="currentColor" fillOpacity={0.2} />
                        </div>
                        <div>
                          <h4 className="font-bold text-moni-dark text-sm mb-1">{item.name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${style?.tag || 'bg-gray-100 text-gray-500'}`}>
                            {item.tag}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-moni-green text-sm">
                          {formatMoney(item.value)}
                        </span>

                        {/* Edit Button (Hide in selection mode) */}
                        <div className={`transition-all duration-200 ${isSelectionMode ? 'w-0 opacity-0 overflow-hidden' : 'w-8 opacity-100'}`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent opening detail view
                              openEditModal(item, activeCategory.id, activeCategory.title);
                            }}
                            className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100 hover:text-moni-brown transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Engaging Empty State */
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-fade-in">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 relative ${CATEGORY_STYLES[activeCategory.title]?.gradient || 'bg-gray-100'}`}>
                {(() => {
                  const Icon = CATEGORY_STYLES[activeCategory.title]?.icon || Wallet;
                  return <Icon size={32} className="opacity-50" fill="currentColor" fillOpacity={0.2} />;
                })()}
                <div className="absolute -right-1 -bottom-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                  <Plus size={16} className="text-moni-brown" />
                </div>
              </div>
              <h3 className="text-moni-dark font-bold text-lg mb-2">Comienza aquí</h3>
              <p className="text-gray-400 text-xs mb-6 max-w-[200px]">
                No tienes {activeCategory.title.toLowerCase()} registrados aún. Agrega el primero para ver crecer tu patrimonio.
              </p>
              <button
                onClick={openNewAssetModal}
                className="bg-moni-brown text-white px-6 py-3 rounded-xl text-xs font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-2"
              >
                <Plus size={16} /> Agregar Activo
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Floating Bulk Action Bar */}
      <div className={`fixed bottom-20 md:absolute left-0 right-0 z-40 transition-transform duration-300 ${isSelectionMode ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-5xl mx-auto bg-white p-4 pb-8 md:pb-4 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] rounded-t-3xl flex items-center justify-between border-t border-gray-50">
          <div className="flex flex-col px-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Seleccionados</span>
            <span className="text-xl font-bold text-moni-dark">{selectedIds.size} activos</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={toggleSelectionMode}
              className="px-5 py-3 rounded-xl font-bold text-xs bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={deleteSelectedAssets}
              disabled={selectedIds.size === 0}
              className="bg-red-50 text-red-500 px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-red-100 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={16} /> Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-moni-dark/40 backdrop-blur-sm z-[60] transition-opacity duration-300"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[60] md:inset-0 md:flex md:items-center md:justify-center pointer-events-none">
            <div className="bg-[#F2F4F8] rounded-t-[2.5rem] md:rounded-[2.5rem] p-6 shadow-2xl transform transition-transform duration-300 ease-out animate-fade-in border-t border-white/50 max-h-[85vh] overflow-y-auto relative pointer-events-auto md:w-full md:max-w-lg">

              {/* Success Toast */}
              {isSuccess && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-moni-green text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50 animate-fade-in">
                  <div className="bg-white/20 rounded-full p-1">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className="text-xs font-bold">Guardado correctamente</span>
                </div>
              )}

              <div className={`transition-all duration-300 ${isSuccess ? 'opacity-50 blur-[2px]' : 'opacity-100'}`}>
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-moni-dark">
                    {editingAsset ? 'Editar Activo' : 'Nuevo Activo'}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-600 shadow-sm">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-6">

                  {/* Valor Input - Minimalist Big */}
                  <div className="text-center relative">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Valor Estimado
                    </label>
                    <div className="relative inline-block max-w-full">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-300">$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={handleAmountChange}
                        className={`bg-transparent text-4xl font-extrabold text-moni-dark text-center w-full focus:outline-none placeholder-gray-200 border-b-2 py-2 ${errors.amount ? 'border-red-300 text-red-500' : 'border-gray-200 focus:border-moni-brown'}`}
                        style={{ paddingLeft: '1.5rem' }}
                      />
                    </div>
                    {errors.amount && (
                      <p className="text-red-400 text-[10px] font-bold mt-1 flex items-center justify-center gap-1 animate-fade-in">
                        <AlertCircle size={10} /> {errors.amount}
                      </p>
                    )}
                  </div>

                  {/* Minimalist Custom Select */}
                  <div className="relative z-20">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Categoría
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                        className="w-full flex items-center justify-between bg-white border-b border-gray-100 px-4 py-4 rounded-xl text-left shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3">
                          {currentCategoryObj && (
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentCategoryObj.gradient}`}>
                              <currentCategoryObj.icon size={16} />
                            </div>
                          )}
                          <span className="font-bold text-moni-dark text-sm">{formData.category}</span>
                        </div>
                        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isCategoryOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto animate-fade-in z-50">
                          {Object.keys(CATEGORY_STYLES).map((catTitle) => {
                            const style = CATEGORY_STYLES[catTitle];
                            const Icon = style.icon;
                            return (
                              <button
                                key={catTitle}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, category: catTitle });
                                  setIsCategoryOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${formData.category === catTitle ? 'bg-gray-50' : ''}`}
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.gradient}`}>
                                  <Icon size={16} />
                                </div>
                                <span className={`text-sm font-bold ${formData.category === catTitle ? 'text-moni-dark' : 'text-gray-500'}`}>
                                  {catTitle}
                                </span>
                                {formData.category === catTitle && <Check size={16} className="ml-auto text-moni-green" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inputs */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Nombre del activo
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (errors.name) setErrors({ ...errors, name: undefined });
                        }}
                        placeholder="Ej. Casa de playa"
                        className={`w-full bg-white border-b-2 px-4 py-4 rounded-xl text-moni-dark font-medium placeholder-gray-300 focus:outline-none focus:border-moni-brown transition-colors shadow-sm ${errors.name ? 'border-red-300 bg-red-50' : 'border-transparent'}`}
                      />
                      {errors.name && (
                        <p className="text-red-400 text-[10px] font-bold mt-1 ml-1 flex items-center gap-1 animate-fade-in">
                          <AlertCircle size={10} /> {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Etiqueta / Subcategoría
                      </label>
                      <input
                        type="text"
                        value={formData.tag}
                        onChange={(e) => {
                          setFormData({ ...formData, tag: e.target.value });
                          if (errors.tag) setErrors({ ...errors, tag: undefined });
                        }}
                        placeholder="Ej. Vacacional"
                        className={`w-full bg-white border-b-2 px-4 py-4 rounded-xl text-moni-dark font-medium placeholder-gray-300 focus:outline-none focus:border-moni-brown transition-colors shadow-sm ${errors.tag ? 'border-red-300 bg-red-50' : 'border-transparent'}`}
                      />
                      {errors.tag && (
                        <p className="text-red-400 text-[10px] font-bold mt-1 ml-1 flex items-center gap-1 animate-fade-in">
                          <AlertCircle size={10} /> {errors.tag}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-moni-brown text-white py-4 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 mt-8"
                  >
                    {editingAsset ? 'Guardar Cambios' : 'Agregar Activo'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
};

export default Assets;
