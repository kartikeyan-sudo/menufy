import { NextResponse } from 'next/server';
import { supabaseAdmin, corsHeaders } from '@/lib/db';

const DEFAULT_RESTAURANT_ID = '11111111-1111-1111-1111-111111111111';

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET /api/menu?restaurant_id=xxx — Fetch all categories + items for a restaurant
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurant_id') || DEFAULT_RESTAURANT_ID;
    const slug = searchParams.get('slug');

    let effectiveRestaurantId = restaurantId;

    // If slug is provided, look up restaurant by slug
    if (slug) {
      const { data: restaurant } = await supabaseAdmin
        .from('restaurants')
        .select('id, name, description')
        .eq('slug', slug)
        .maybeSingle();

      if (restaurant) {
        effectiveRestaurantId = restaurant.id;
      }
    }

    // Fetch categories
    const { data: categories, error: catError } = await supabaseAdmin
      .from('menu_categories')
      .select('*')
      .eq('restaurant_id', effectiveRestaurantId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (catError) {
      console.error('GET /api/menu categories error:', catError.message);
    }

    // Fetch menu items
    const { data: items, error: itemError } = await supabaseAdmin
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', effectiveRestaurantId)
      .order('sort_order', { ascending: true });

    if (itemError) {
      console.error('GET /api/menu items error:', itemError.message);
    }

    return NextResponse.json(
      {
        success: true,
        categories: categories || [],
        items: items || [],
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('GET /api/menu error:', err);
    return NextResponse.json(
      { success: false, error: err.message, categories: [], items: [] },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST /api/menu — Create a category or item
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, restaurant_id, ...data } = body;
    const effectiveRestaurantId = restaurant_id || DEFAULT_RESTAURANT_ID;

    if (type === 'category') {
      const { data: category, error } = await supabaseAdmin
        .from('menu_categories')
        .insert({
          restaurant_id: effectiveRestaurantId,
          name: data.name,
          sort_order: data.sort_order || 0,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { success: true, category },
        { headers: corsHeaders }
      );
    }

    if (type === 'item') {
      const { data: item, error } = await supabaseAdmin
        .from('menu_items')
        .insert({
          restaurant_id: effectiveRestaurantId,
          category_id: data.category_id,
          name: data.name,
          description: data.description || '',
          price: Number(data.price),
          image_url: data.image_url || null,
          is_available: data.is_available !== false,
          sort_order: data.sort_order || 0,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { success: true, item },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: 'Invalid type. Must be "category" or "item".' },
      { status: 400, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('POST /api/menu error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PATCH /api/menu — Update a category or item
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { type, id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (type === 'category') {
      const updateObj: any = {};
      if (updates.name !== undefined) updateObj.name = updates.name;
      if (updates.sort_order !== undefined) updateObj.sort_order = updates.sort_order;
      if (updates.is_active !== undefined) updateObj.is_active = updates.is_active;

      const { data: category, error } = await supabaseAdmin
        .from('menu_categories')
        .update(updateObj)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { success: true, category },
        { headers: corsHeaders }
      );
    }

    if (type === 'item') {
      const updateObj: any = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) updateObj.name = updates.name;
      if (updates.description !== undefined) updateObj.description = updates.description;
      if (updates.price !== undefined) updateObj.price = Number(updates.price);
      if (updates.image_url !== undefined) updateObj.image_url = updates.image_url;
      if (updates.is_available !== undefined) updateObj.is_available = updates.is_available;
      if (updates.category_id !== undefined) updateObj.category_id = updates.category_id;
      if (updates.sort_order !== undefined) updateObj.sort_order = updates.sort_order;

      const { data: item, error } = await supabaseAdmin
        .from('menu_items')
        .update(updateObj)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { success: true, item },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: 'Invalid type. Must be "category" or "item".' },
      { status: 400, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('PATCH /api/menu error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE /api/menu?type=category&id=xxx or ?type=item&id=xxx
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Missing type or id.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (type === 'category') {
      // Delete all items in this category first
      await supabaseAdmin
        .from('menu_items')
        .delete()
        .eq('category_id', id);

      const { error } = await supabaseAdmin
        .from('menu_categories')
        .delete()
        .eq('id', id);

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { success: true },
        { headers: corsHeaders }
      );
    }

    if (type === 'item') {
      const { error } = await supabaseAdmin
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { success: true },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: 'Invalid type. Must be "category" or "item".' },
      { status: 400, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('DELETE /api/menu error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
