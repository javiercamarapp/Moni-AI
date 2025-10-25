import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Trash2, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { LoadingScreen } from '@/components/LoadingScreen';
interface Category {
  id: string;
  name: string;
  type: 'ingreso' | 'gasto';
  color: string;
  parent_id?: string | null;
  subcategories?: Category[];
}
const GestionarCategorias = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'ingreso' as 'ingreso' | 'gasto',
    color: 'bg-primary/20',
    parent_id: null as string | null
  });
  const [subcategoryNames, setSubcategoryNames] = useState<string[]>([]);
  const [parentCategoryForSubcategory, setParentCategoryForSubcategory] = useState<Category | null>(null);
  const colorOptions = ['bg-primary/20', 'bg-secondary/20', 'bg-accent/20', 'bg-red-500/20', 'bg-orange-500/20', 'bg-yellow-500/20', 'bg-green-500/20', 'bg-blue-500/20', 'bg-purple-500/20', 'bg-pink-500/20'];
  
  const getCategoryIcon = (name: string) => {
    // Extraer el emoji del nombre si ya lo tiene
    const emojiMatch = name.match(/^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u);
    if (emojiMatch) {
      return emojiMatch[1];
    }
    
    // Fallback para categorías sin emoji en el nombre
    const icons: Record<string, string> = {
      'vivienda': '🏠',
      'transporte': '🚗',
      'alimentación': '🍽️',
      'servicios y suscripciones': '🧾',
      'salud y bienestar': '🩺',
      'educación y desarrollo': '🎓',
      'deudas y créditos': '💳',
      'entretenimiento y estilo de vida': '🎉',
      'ahorro e inversión': '💸',
      'apoyos y otros': '🤝',
      'mascotas': '🐾',
      'categoría personalizada': '⭐',
      'gastos no identificados': '❓',
      'salario': '💼',
      'sueldo': '💼',
      'bonos': '💰',
      'comisiones': '💰',
      'freelance': '💸',
      'servicios': '💸',
      'inversiones': '📈',
      'rentas': '🏠',
      'regalos': '🎁',
      'donaciones': '🎁',
      'reembolsos': '💳',
      'venta de bienes': '🚗',
      'educación': '🧠',
      'becas': '🧠',
      'ingresos digitales': '🌐',
      'cripto': '🪙',
      'nft': '🪙',
      'sociedades': '🤝',
      'dividendos': '🤝',
    };
    return icons[name.toLowerCase()] || '📊';
  };
  useEffect(() => {
    fetchCategories();
  }, []);
  const fetchCategories = async () => {
    try {
      console.log('Fetching categories...');
      
      // Get user with timeout
      const userPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout getting user')), 5000)
      );
      
      const { data: { user } } = await Promise.race([userPromise, timeoutPromise]) as any;
      
      console.log('User:', user?.id);
      
      if (!user) {
        console.log('No user found, redirecting to auth');
        navigate('/auth');
        setLoading(false);
        return;
      }
      
      const {
        data,
        error
      } = await supabase.from('categories').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      });
      
      console.log('Categories data:', data);
      console.log('Categories error:', error);
      
      if (error) throw error;

      // Organize categories and subcategories
      const allCategories = (data || []) as Category[];
      const mainCategories = allCategories.filter(cat => !cat.parent_id);

      // Attach subcategories to their parents
      mainCategories.forEach(mainCat => {
        mainCat.subcategories = allCategories.filter(cat => cat.parent_id === mainCat.id);
      });
      
      console.log('Main categories:', mainCategories);
      setCategories(mainCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron cargar las categorías",
        variant: "destructive"
      });
      setLoading(false);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      
      // First, create the main category
      const { data: parentCategory, error: parentError } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: newCategory.name,
          type: newCategory.type,
          color: newCategory.color,
          parent_id: newCategory.parent_id
        })
        .select()
        .single();
      
      if (parentError) throw parentError;
      
      // If there are subcategories and this is not a subcategory itself, create them
      if (subcategoryNames.length > 0 && !newCategory.parent_id && parentCategory) {
        const subcategoriesToInsert = subcategoryNames
          .filter(name => name.trim() !== '')
          .map(name => ({
            user_id: user.id,
            name: name.trim(),
            type: newCategory.type,
            color: newCategory.color,
            parent_id: parentCategory.id
          }));
        
        if (subcategoriesToInsert.length > 0) {
          const { error: subError } = await supabase
            .from('categories')
            .insert(subcategoriesToInsert);
          
          if (subError) throw subError;
        }
      }
      
      toast({
        title: newCategory.parent_id ? "Subcategoría creada" : "Categoría creada",
        description: newCategory.parent_id 
          ? "Tu nueva subcategoría ha sido creada exitosamente" 
          : subcategoryNames.length > 0 
            ? `Categoría y ${subcategoryNames.filter(n => n.trim()).length} subcategoría(s) creadas exitosamente`
            : "Tu nueva categoría ha sido creada exitosamente"
      });
      
      setNewCategory({
        name: '',
        type: 'ingreso',
        color: 'bg-primary/20',
        parent_id: null
      });
      setSubcategoryNames([]);
      setShowAddDialog(false);
      setParentCategoryForSubcategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la categoría",
        variant: "destructive"
      });
    }
  };
  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      const {
        error
      } = await supabase.from('categories').update({
        name: editingCategory.name,
        color: editingCategory.color
      }).eq('id', editingCategory.id);
      if (error) throw error;
      toast({
        title: "Categoría actualizada",
        description: "Los cambios han sido guardados"
      });
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría",
        variant: "destructive"
      });
    }
  };
  const handleDeleteCategory = async () => {
    if (!deleteCategory) return;
    try {
      const {
        error
      } = await supabase.from('categories').delete().eq('id', deleteCategory.id);
      if (error) throw error;
      toast({
        title: "Categoría eliminada",
        description: "La categoría ha sido eliminada exitosamente"
      });
      setDeleteCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría",
        variant: "destructive"
      });
    }
  };
  const ingresos = categories.filter(c => c.type === 'ingreso');
  const gastos = categories.filter(c => c.type === 'gasto');
  const openAddSubcategoryDialog = (parentCategory: Category) => {
    setParentCategoryForSubcategory(parentCategory);
    setNewCategory({
      name: '',
      type: parentCategory.type,
      color: parentCategory.color,
      parent_id: parentCategory.id
    });
    setShowAddDialog(true);
  };
  const renderCategoryCard = (category: Category, isSubcategory: boolean = false) => {
    // Extraer emoji y nombre limpio
    const emojiMatch = category.name.match(/^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])\s*/u);
    const emoji = emojiMatch ? emojiMatch[1] : getCategoryIcon(category.name);
    const cleanName = emojiMatch ? category.name.replace(/^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])\s*/u, '') : category.name;
    
    return <div key={category.id}>
      <Card className={`p-4 bg-white/90 backdrop-blur-md rounded-[24px] shadow-lg border-0 animate-fade-in hover:shadow-xl transition-all duration-300 ${isSubcategory ? 'ml-8 mt-2' : ''}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {!isSubcategory ? (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-sm flex items-center justify-center text-2xl flex-shrink-0">
                {emoji}
              </div>
            ) : (
              <div className={`w-12 h-12 rounded-2xl ${category.color} flex-shrink-0`} />
            )}
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-semibold text-foreground truncate">{cleanName}</p>
              {!isSubcategory && category.subcategories && category.subcategories.length > 0 && <p className="text-xs text-muted-foreground truncate">{category.subcategories.length} subcategorías</p>}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {!isSubcategory && <Button size="icon" variant="ghost" onClick={() => openAddSubcategoryDialog(category)} className="text-primary hover:bg-primary/10 rounded-full hover:scale-105 active:scale-95 transition-all h-8 w-8 flex-shrink-0" title="Agregar subcategoría">
                <Plus className="h-4 w-4" />
              </Button>}
            <Button size="icon" variant="ghost" onClick={() => setEditingCategory(category)} className="hover:bg-accent/20 rounded-full hover:scale-105 active:scale-95 transition-all h-8 w-8 flex-shrink-0">
              <Edit2 className="h-4 w-4 text-foreground" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setDeleteCategory(category)} className="text-destructive hover:bg-destructive/10 rounded-full hover:scale-105 active:scale-95 transition-all h-8 w-8 flex-shrink-0">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
      {/* Render subcategories */}
      {!isSubcategory && category.subcategories && category.subcategories.map(subcat => renderCategoryCard(subcat, true))}
    </div>;
  };
  if (loading) {
    return <LoadingScreen />;
  }
  return <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => {
                  e.preventDefault();
                  navigate(-1);
                }} 
                className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 text-gray-700" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
                  Gestionar Categorías
                </h1>
                <p className="text-sm text-gray-500">Personaliza tus categorías</p>
              </div>
            </div>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="icon" onClick={() => {
                  setParentCategoryForSubcategory(null);
                  setSubcategoryNames([]);
                  setNewCategory({
                    name: '',
                    type: 'ingreso',
                    color: 'bg-primary/20',
                    parent_id: null
                  });
                }} className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10 flex-shrink-0">
                  <Plus className="h-4 w-4 text-gray-700" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white/95 backdrop-blur-md rounded-[24px] shadow-lg border-0 max-w-[90%] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-foreground">
                    {parentCategoryForSubcategory ? `Nueva Subcategoría de "${parentCategoryForSubcategory.name}"` : 'Nueva Categoría'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleAddCategory} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-card-foreground/90 text-base">
                      Nombre de la categoría
                    </Label>
                    <Input id="name" placeholder="Ej: Educación, Entretenimiento..." value={newCategory.name} onChange={e => setNewCategory({
                    ...newCategory,
                    name: e.target.value
                  })} required className="bg-white border-blue-100 text-foreground placeholder:text-muted-foreground h-14" />
                  </div>

                  {!parentCategoryForSubcategory && <div className="space-y-2">
                      <Label className="text-foreground/90 text-base">Tipo</Label>
                      <div className="flex gap-3">
                        <Button 
                          type="button" 
                          onClick={() => setNewCategory({
                            ...newCategory,
                            type: 'ingreso',
                            parent_id: null
                          })} 
                          className={`flex-1 rounded-full shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all h-10 font-medium ${
                            newCategory.type === 'ingreso' 
                              ? 'bg-primary text-white hover:bg-primary/90' 
                              : 'bg-white/80 backdrop-blur-sm border-0 text-foreground hover:bg-white'
                          }`}
                        >
                          Ingreso
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setNewCategory({
                            ...newCategory,
                            type: 'gasto',
                            parent_id: null
                          })} 
                          className={`flex-1 rounded-full shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all h-10 font-medium ${
                            newCategory.type === 'gasto' 
                              ? 'bg-primary text-white hover:bg-primary/90' 
                              : 'bg-white/80 backdrop-blur-sm border-0 text-foreground hover:bg-white'
                          }`}
                        >
                          Gasto
                        </Button>
                      </div>
                    </div>}

                  {!parentCategoryForSubcategory && <div className="space-y-2">
                      <Label className="text-foreground/90 text-base">Subcategorías (opcional)</Label>
                      <div className="space-y-2">
                        {subcategoryNames.map((name, index) => <div key={index} className="flex gap-2">
                            <Input value={name} onChange={e => {
                            const newNames = [...subcategoryNames];
                            newNames[index] = e.target.value;
                            setSubcategoryNames(newNames);
                          }} placeholder="Nombre de subcategoría..." className="bg-white border-blue-100 text-foreground h-12" />
                            <Button type="button" size="icon" variant="ghost" onClick={() => {
                            setSubcategoryNames(subcategoryNames.filter((_, i) => i !== index));
                          }} className="text-destructive hover:bg-destructive/10 h-12 w-12">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>)}
                        <Button type="button" variant="outline" onClick={() => setSubcategoryNames([...subcategoryNames, ''])} className="w-full bg-white/80 backdrop-blur-sm rounded-full shadow-sm border-0 hover:bg-white hover:shadow-md hover:scale-105 active:scale-95 transition-all h-10 font-medium">
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Subcategoría
                        </Button>
                      </div>
                    </div>}

                  <div className="space-y-2">
                    <Label className="text-foreground/90 text-base">Color</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {colorOptions.map(color => <button key={color} type="button" onClick={() => setNewCategory({
                      ...newCategory,
                      color
                    })} className={`w-full h-12 rounded-lg ${color} border-2 ${newCategory.color === color ? 'border-primary' : 'border-blue-100'} hover:border-primary/50 transition-colors`} />)}
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all h-12 font-semibold">
                    {parentCategoryForSubcategory ? 'Crear Subcategoría' : 'Crear Categoría'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Tabs: Ingresos y Gastos */}
      <div className="max-w-7xl mx-auto px-4">
        <Tabs defaultValue="ingresos" className="w-full">
          <TabsList className="w-full bg-white/80 backdrop-blur-sm shadow-sm border-0 rounded-2xl p-1">
            <TabsTrigger value="ingresos" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-600 data-[state=active]:text-gray-900 transition-all rounded-xl font-medium">
              Ingresos ({ingresos.length})
            </TabsTrigger>
            <TabsTrigger value="gastos" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-600 data-[state=active]:text-gray-900 transition-all rounded-xl font-medium">
              Gastos ({gastos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ingresos" className="space-y-3 mt-4">
            {ingresos.map(category => renderCategoryCard(category))}
          </TabsContent>

          <TabsContent value="gastos" className="space-y-3 mt-4">
            {gastos.map(category => renderCategoryCard(category))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={open => !open && setEditingCategory(null)}>
        <DialogContent className="bg-white/95 backdrop-blur-md rounded-[24px] shadow-lg border-0 max-w-[90%] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">
              Editar Categoría
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleEditCategory} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-foreground/90 text-base">
                Nombre de la categoría
              </Label>
              <Input 
                id="edit-name" 
                value={editingCategory?.name || ''} 
                onChange={e => setEditingCategory(editingCategory ? {
                  ...editingCategory,
                  name: e.target.value
                } : null)} 
                required 
                className="bg-white border-blue-100 text-foreground h-14" 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground/90 text-base">Color</Label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map(color => <button 
                  key={color} 
                  type="button" 
                  onClick={() => setEditingCategory(editingCategory ? {
                    ...editingCategory,
                    color
                  } : null)} 
                  className={`w-full h-12 rounded-lg ${color} border-2 ${editingCategory?.color === color ? 'border-primary' : 'border-blue-100'} hover:border-primary/50 transition-colors`} 
                />)}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all h-12 font-semibold"
            >
              Guardar Cambios
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCategory} onOpenChange={open => !open && setDeleteCategory(null)}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-md rounded-[24px] shadow-lg border-0 max-w-[90%] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold text-foreground">¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Esta acción no se puede deshacer. La categoría "{deleteCategory?.name}" será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm border-0 text-foreground hover:bg-white hover:shadow-md hover:scale-105 active:scale-95 transition-all h-10 px-4 font-medium">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive rounded-full shadow-sm hover:bg-destructive/90 text-destructive-foreground hover:scale-105 active:scale-95 hover:shadow-md transition-all h-10 px-4 font-medium">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default GestionarCategorias;
