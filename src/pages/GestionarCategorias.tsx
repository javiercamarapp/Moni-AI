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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Category {
  id: string;
  name: string;
  type: 'ingreso' | 'gasto';
  color: string;
}

const GestionarCategorias = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', type: 'ingreso' as 'ingreso' | 'gasto', color: 'bg-primary/20' });

  const colorOptions = [
    'bg-primary/20',
    'bg-secondary/20',
    'bg-accent/20',
    'bg-red-500/20',
    'bg-orange-500/20',
    'bg-yellow-500/20',
    'bg-green-500/20',
    'bg-blue-500/20',
    'bg-purple-500/20',
    'bg-pink-500/20',
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCategories((data || []) as Category[]);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: newCategory.name,
          type: newCategory.type,
          color: newCategory.color,
        });

      if (error) throw error;

      toast({
        title: "Categoría creada",
        description: "Tu nueva categoría ha sido creada exitosamente",
      });

      setNewCategory({ name: '', type: 'ingreso', color: 'bg-primary/20' });
      setShowAddDialog(false);
      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la categoría",
        variant: "destructive",
      });
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: editingCategory.name,
          color: editingCategory.color,
        })
        .eq('id', editingCategory.id);

      if (error) throw error;

      toast({
        title: "Categoría actualizada",
        description: "Los cambios han sido guardados",
      });

      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategory) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', deleteCategory.id);

      if (error) throw error;

      toast({
        title: "Categoría eliminada",
        description: "La categoría ha sido eliminada exitosamente",
      });

      setDeleteCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría",
        variant: "destructive",
      });
    }
  };

  const ingresos = categories.filter(c => c.type === 'ingreso');
  const gastos = categories.filter(c => c.type === 'gasto');

  if (loading) {
    return (
      <div className="min-h-screen animated-wave-bg flex items-center justify-center">
        <p className="text-white text-lg">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border/30 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 text-foreground hover:scale-105 transition-all border border-blue-100 h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Gestionar Categorías
            </h1>
            <p className="text-sm text-muted-foreground">Personaliza tus categorías</p>
          </div>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 border border-blue-100 transition-all hover:scale-105 h-10 w-10"
            >
              <Plus className="h-5 w-5 text-foreground" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white rounded-[20px] shadow-xl border border-blue-100 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-foreground">
                Nueva Categoría
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleAddCategory} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-card-foreground/90 text-base">
                  Nombre de la categoría
                </Label>
                <Input
                  id="name"
                  placeholder="Ej: Educación, Entretenimiento..."
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  required
                  className="bg-white border-blue-100 text-foreground placeholder:text-muted-foreground h-14"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground/90 text-base">Tipo</Label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => setNewCategory({ ...newCategory, type: 'ingreso' })}
                    className={`flex-1 ${newCategory.type === 'ingreso' ? 'bg-primary text-white' : 'bg-white text-foreground border border-blue-100'} hover:bg-primary/80 h-12`}
                  >
                    Ingreso
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setNewCategory({ ...newCategory, type: 'gasto' })}
                    className={`flex-1 ${newCategory.type === 'gasto' ? 'bg-primary text-white' : 'bg-white text-foreground border border-blue-100'} hover:bg-primary/80 h-12`}
                  >
                    Gasto
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground/90 text-base">Color</Label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCategory({ ...newCategory, color })}
                      className={`w-full h-12 rounded-lg ${color} border-2 ${newCategory.color === color ? 'border-primary' : 'border-blue-100'} hover:border-primary/50 transition-colors`}
                    />
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-lg font-semibold"
              >
                Crear Categoría
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs: Ingresos y Gastos */}
      <div className="px-4">
        <Tabs defaultValue="ingresos" className="w-full">
          <TabsList className="w-full bg-white rounded-[20px] shadow-xl border border-blue-100">
            <TabsTrigger value="ingresos" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white text-foreground rounded-[16px]">
              Ingresos ({ingresos.length})
            </TabsTrigger>
            <TabsTrigger value="gastos" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white text-foreground rounded-[16px]">
              Gastos ({gastos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ingresos" className="space-y-3 mt-4">
            {ingresos.map((category) => (
              <Card key={category.id} className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100 animate-fade-in hover:scale-105 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-12 h-12 rounded-lg ${category.color}`} />
                    <p className="text-lg font-semibold text-foreground">{category.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingCategory(category)}
                      className="text-foreground hover:bg-accent/50 hover:scale-105 transition-all"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleteCategory(category)}
                      className="text-destructive hover:bg-destructive/10 hover:scale-105 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="gastos" className="space-y-3 mt-4">
            {gastos.map((category) => (
              <Card key={category.id} className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100 animate-fade-in hover:scale-105 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-12 h-12 rounded-lg ${category.color}`} />
                    <p className="text-lg font-semibold text-foreground">{category.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingCategory(category)}
                      className="text-foreground hover:bg-accent/50 hover:scale-105 transition-all"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleteCategory(category)}
                      className="text-destructive hover:bg-destructive/10 hover:scale-105 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="bg-white rounded-[20px] shadow-xl border border-blue-100 max-w-md">
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
              <Input
                id="edit-name"
                value={editingCategory?.name || ''}
                onChange={(e) => setEditingCategory(editingCategory ? { ...editingCategory, name: e.target.value } : null)}
                required
                className="bg-white border-blue-100 text-foreground h-14"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground/90 text-base">Color</Label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setEditingCategory(editingCategory ? { ...editingCategory, color } : null)}
                    className={`w-full h-12 rounded-lg ${color} border-2 ${editingCategory?.color === color ? 'border-primary' : 'border-blue-100'} hover:border-primary/50 transition-colors`}
                  />
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-lg font-semibold"
            >
              Guardar Cambios
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCategory} onOpenChange={(open) => !open && setDeleteCategory(null)}>
        <AlertDialogContent className="bg-white rounded-[20px] shadow-xl border border-blue-100">
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
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive/80 hover:bg-destructive text-destructive-foreground"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GestionarCategorias;
