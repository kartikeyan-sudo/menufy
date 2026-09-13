import { NextResponse } from 'next/server';
import { supabaseAdmin, corsHeaders } from '@/lib/db';

const DEFAULT_RESTAURANT_ID = '11111111-1111-1111-1111-111111111111';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { restaurant_id, data } = body;
    const effectiveRestaurantId = restaurant_id || DEFAULT_RESTAURANT_ID;

    if (!data || !Array.isArray(data.categories)) {
      return NextResponse.json(
        { success: false, error: 'Invalid data format. Expected { categories: [...] }' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { categories } = data;
    let importedCategoriesCount = 0;
    let importedItemsCount = 0;

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      if (!cat.name) continue;

      // Check if category already exists for the restaurant
      let categoryId = '';
      const { data: existingCat } = await supabaseAdmin
        .from('menu_categories')
        .select('id')
        .eq('restaurant_id', effectiveRestaurantId)
        .eq('name', cat.name)
        .maybeSingle();

      if (existingCat) {
        categoryId = existingCat.id;
      } else {
        // Create new category
        const { data: newCat, error: catError } = await supabaseAdmin
          .from('menu_categories')
          .insert({
            restaurant_id: effectiveRestaurantId,
            name: cat.name,
            sort_order: i,
            is_active: true,
          })
          .select('id')
          .single();

        if (catError) {
          console.error('Failed to create category:', catError);
          continue;
        }
        categoryId = newCat.id;
        importedCategoriesCount++;
      }

      if (cat.items && Array.isArray(cat.items)) {
        for (let j = 0; j < cat.items.length; j++) {
          const item = cat.items[j];
          if (!item.name || item.price === undefined) continue;

          const { error: itemError } = await supabaseAdmin
            .from('menu_items')
            .insert({
              restaurant_id: effectiveRestaurantId,
              category_id: categoryId,
              name: item.name,
              description: item.description || '',
              price: Number(item.price),
              image_url: item.image_url || null,
              is_available: item.is_available !== false,
              sort_order: j,
            });

          if (itemError) {
            console.error('Failed to create item:', itemError);
          } else {
            importedItemsCount++;
          }
        }
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        message: `Successfully imported ${importedCategoriesCount} categories and ${importedItemsCount} items.` 
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('POST /api/menu/import error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
