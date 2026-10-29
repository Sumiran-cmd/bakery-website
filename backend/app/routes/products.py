from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Category, Product, ProductVariant

products_bp = Blueprint('products', __name__, url_prefix='/api')


@products_bp.route('/categories', methods=['GET'])
def get_categories():
    categories = Category.query.order_by(Category.sort_order).all()
    return jsonify({'categories': [c.to_dict() for c in categories]}), 200


@products_bp.route('/products', methods=['GET'])
def get_products():
    query = Product.query.filter_by(is_active=True)

    # Category filter
    category_slug = request.args.get('category')
    if category_slug and category_slug.strip().lower() != 'all':
        normalized = category_slug.strip().lower()
        slug_alt = normalized.replace(' ', '-').replace('_', '-')
        cat = Category.query.filter(
            db.or_(
                Category.slug == normalized,
                Category.slug == slug_alt,
                Category.name.ilike(normalized),
                Category.name.ilike(category_slug.strip())
            )
        ).first()
        if cat:
            query = query.filter_by(category_id=cat.id)
        else:
            query = query.filter(Product.id == -1)

    # Search (searches name, short_description, full description, flavor notes, origin, category)
    search = request.args.get('search', '').strip()
    if search:
        query = query.outerjoin(Category).filter(
            db.or_(
                Product.name.ilike(f'%{search}%'),
                Product.short_description.ilike(f'%{search}%'),
                Product.description.ilike(f'%{search}%'),
                Product.flavor_notes.ilike(f'%{search}%'),
                Product.origin.ilike(f'%{search}%'),
                Category.name.ilike(f'%{search}%')
            )
        )

    # Special filters
    if request.args.get('featured') == 'true':
        query = query.filter_by(is_featured=True)
    if request.args.get('new') == 'true':
        query = query.filter_by(is_new=True)
    if request.args.get('best_seller') == 'true':
        query = query.filter_by(is_best_seller=True)

    # Sorting
    sort = request.args.get('sort', 'default')
    if sort in ('price_asc', 'price_desc'):
        min_price_sq = db.session.query(
            ProductVariant.product_id,
            db.func.min(ProductVariant.price).label('min_price')
        ).filter(ProductVariant.is_active == True).group_by(ProductVariant.product_id).subquery()

        query = query.outerjoin(min_price_sq, Product.id == min_price_sq.c.product_id)
        if sort == 'price_asc':
            query = query.order_by(min_price_sq.c.min_price.asc().nullslast(), Product.sort_order.asc())
        else:
            query = query.order_by(min_price_sq.c.min_price.desc().nullslast(), Product.sort_order.asc())
    elif sort == 'name_asc':
        query = query.order_by(Product.name.asc())
    elif sort == 'name_desc':
        query = query.order_by(Product.name.desc())
    elif sort == 'newest':
        query = query.order_by(Product.created_at.desc())
    else:
        query = query.order_by(Product.sort_order.asc(), Product.created_at.desc())

    # Eager load relationships to avoid N+1 queries during serialization
    from sqlalchemy.orm import selectinload, joinedload
    query = query.options(
        joinedload(Product.category),
        selectinload(Product.variants),
        selectinload(Product.images)
    )

    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    per_page = min(per_page, 48)  # cap

    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    # If the user was on an out-of-range page after changing filters, auto-fallback to page 1
    if page > 1 and paginated.total > 0 and page > paginated.pages:
        paginated = query.paginate(page=1, per_page=per_page, error_out=False)

    return jsonify({
        'products': [p.to_dict(include_variants=True) for p in paginated.items],
        'pagination': {
            'page': paginated.page,
            'per_page': paginated.per_page,
            'total': paginated.total,
            'pages': paginated.pages,
            'has_next': paginated.has_next,
            'has_prev': paginated.has_prev
        }
    }), 200


@products_bp.route('/products/<slug>', methods=['GET'])
def get_product(slug):
    from sqlalchemy.orm import selectinload, joinedload
    product = Product.query.options(
        joinedload(Product.category),
        selectinload(Product.variants),
        selectinload(Product.images)
    ).filter_by(slug=slug, is_active=True).first_or_404()
    data = product.to_dict(include_variants=True)

    # Related products (same category, different product)
    related = Product.query.options(
        joinedload(Product.category),
        selectinload(Product.variants),
        selectinload(Product.images)
    ).filter(
        Product.category_id == product.category_id,
        Product.id != product.id,
        Product.is_active == True
    ).limit(4).all()
    data['related_products'] = [p.to_dict(include_variants=False) for p in related]

    return jsonify({'product': data}), 200
