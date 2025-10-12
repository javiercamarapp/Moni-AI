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
  const renderCategoryCard = (category: Category, isSubcategory: boolean = false) => <div key={category.id}>
      <Card className={`p-4 bg-white rounded-[20px] shadow-xl border border-blue-100 animate-fade-in hover:scale-[1.02] transition-all ${isSubcategory ? 'ml-8 mt-2' : ''}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-12 h-12 rounded-lg ${category.color} flex-shrink-0`} />
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-base font-bold text-foreground truncate">{category.name}</p>
              {!isSubcategory && category.subcategories && category.subcategories.length > 0 && <p className="text-xs text-foreground/60 truncate">{category.subcategories.length} subcategorías</p>}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {!isSubcategory && <Button size="icon" variant="ghost" onClick={() => openAddSubcategoryDialog(category)} className="text-primary hover:bg-primary/10 hover:scale-110 transition-all h-8 w-8 flex-shrink-0" title="Agregar subcategoría">
                <Plus className="h-4 w-4" />
              </Button>}
            <Button size="icon" variant="ghost" onClick={() => setEditingCategory(category)} className="hover:bg-accent hover:scale-110 transition-all h-8 w-8 flex-shrink-0">
              <Edit2 className="h-4 w-4 text-foreground" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setDeleteCategory(category)} className="text-destructive hover:bg-destructive/10 hover:scale-110 transition-all h-8 w-8 flex-shrink-0">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
      {/* Render subcategories */}
      {!isSubcategory && category.subcategories && category.subcategories.map(subcat => renderCategoryCard(subcat, true))}
    </div>;
  if (loading) {
    return <div className="min-h-screen animated-wave-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Cargando categorías...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 hover:scale-105 transition-all border border-blue-100 h-10 w-10">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground drop-shadow-lg">
              Gestionar Categorías
            </h1>
            <p className="text-sm text-foreground/80 drop-shadow-md font-medium">Personaliza tus categorías</p>
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
            }} className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 border border-blue-100 transition-all hover:scale-105 h-10 w-10">
              <Plus className="h-5 w-5 text-foreground" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white rounded-[20px] shadow-xl border border-blue-100 max-w-[85%] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-foreground">
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
                      className={`flex-1 rounded-[20px] shadow-xl border border-blue-100 hover:scale-105 transition-all h-12 ${
                        newCategory.type === 'ingreso' 
                          ? 'bg-primary text-white hover:bg-primary/90' 
                          : 'bg-white text-foreground hover:bg-gray-50'
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
                      className={`flex-1 rounded-[20px] shadow-xl border border-blue-100 hover:scale-105 transition-all h-12 ${
                        newCategory.type === 'gasto' 
                          ? 'bg-primary text-white hover:bg-primary/90' 
                          : 'bg-white text-foreground hover:bg-gray-50'
                      }`}
                    >
                      Gasto
                    </Button>
                  </div>
                </div>}

              {!parentCategoryForSubcategory && <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground/90 text-base">Subcategorías</Label>
                    <Button 
                      type="button"
                      size="sm"
                      onClick={() => setSubcategoryNames([...subcategoryNames, ''])}
                      className="bg-primary/10 hover:bg-primary/20 text-primary h-8 gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Agregar
                    </Button>
                  </div>
                  
                  {subcategoryNames.map((subName, index) => (
                    <div key={index} className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <Input
                        placeholder={`Subcategoría ${index + 1}`}
                        value={subName}
                        onChange={(e) => {
                          const updated = [...subcategoryNames];
                          updated[index] = e.target.value;
                          setSubcategoryNames(updated);
                        }}
                        className="bg-white border-blue-100 text-foreground h-12"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setSubcategoryNames(subcategoryNames.filter((_, i) => i !== index));
                        }}
                        className="text-destructive hover:bg-destructive/10 h-12 w-12"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
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

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-[20px] shadow-xl border border-blue-100 hover:scale-105 transition-all h-14 text-lg font-semibold">
                {parentCategoryForSubcategory ? 'Crear Subcategoría' : 'Crear Categoría'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs: Ingresos y Gastos */}
      <div className="px-4">
        <Tabs defaultValue="ingresos" className="w-full">
          <TabsList className="w-full bg-white rounded-[20px] shadow-xl border border-blue-100">
            <TabsTrigger value="ingresos" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white rounded-[16px] font-semibold">
              Ingresos ({ingresos.length})
            </TabsTrigger>
            <TabsTrigger value="gastos" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white rounded-[16px] font-semibold">
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
        <DialogContent className="bg-white rounded-[20px] shadow-xl border border-blue-100 max-w-[85%] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">
              Editar Categoría
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleEditCategory} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-foreground/90 text-base">
                Nombre de la categoría
              </Label>
              <Input id="edit-name" value={editingCategory?.name || ''} onChange={e => setEditingCategory(editingCategory ? {
              ...editingCategory,
              name: e.target.value
            } : null)} required className="bg-white border-blue-100 text-foreground h-14" />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground/90 text-base">Color</Label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map(color => <button key={color} type="button" onClick={() => setEditingCategory(editingCategory ? {
                ...editingCategory,
                color
              } : null)} className={`w-full h-12 rounded-lg ${color} border-2 ${editingCategory?.color === color ? 'border-primary' : 'border-blue-100'} hover:border-primary/50 transition-colors`} />)}
              </div>
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-[20px] shadow-xl border border-blue-100 hover:scale-105 transition-all h-14 text-lg font-semibold">
              Guardar Cambios
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCategory} onOpenChange={open => !open && setDeleteCategory(null)}>
        <AlertDialogContent className="bg-white rounded-[20px] shadow-xl border border-blue-100 max-w-[85%] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta acción no se puede deshacer. La categoría "{deleteCategory?.name}" será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white border border-blue-100 text-foreground hover:bg-gray-50">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive/80 hover:bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default GestionarCategorias;
