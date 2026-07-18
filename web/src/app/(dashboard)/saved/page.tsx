"use client";

import { DesktopTopBar } from "@/components/layout/top-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductCard } from "@/components/marketplace/product-card";
import { PRODUCTS } from "@/lib/mock/products";
import { Bookmark } from "lucide-react";

export default function SavedPage() {
  const savedProducts = PRODUCTS.slice(0, 2);

  return (
    <div className="space-y-6">
      <DesktopTopBar title="Favoritos y guardados" description="Productos, requerimientos, productores y transportistas guardados." />

      <Tabs defaultValue="productos">
        <TabsList className="flex-wrap">
          <TabsTrigger value="productos">Productos</TabsTrigger>
          <TabsTrigger value="requerimientos">Requerimientos</TabsTrigger>
          <TabsTrigger value="productores">Productores</TabsTrigger>
          <TabsTrigger value="transportistas">Transportistas</TabsTrigger>
        </TabsList>

        <TabsContent value="productos" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {savedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </TabsContent>
        <TabsContent value="requerimientos">
          <EmptyState icon={Bookmark} title="Sin requerimientos guardados" />
        </TabsContent>
        <TabsContent value="productores">
          <EmptyState icon={Bookmark} title="Sin productores guardados" />
        </TabsContent>
        <TabsContent value="transportistas">
          <EmptyState icon={Bookmark} title="Sin transportistas guardados" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
