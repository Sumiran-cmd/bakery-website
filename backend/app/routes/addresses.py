from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Address
from flask_jwt_extended import jwt_required, get_jwt_identity

addresses_bp = Blueprint('addresses', __name__, url_prefix='/api/addresses')


@addresses_bp.route('', methods=['GET'])
@jwt_required()
def get_addresses():
    user_id = int(get_jwt_identity())
    addresses = Address.query.filter_by(user_id=user_id).order_by(Address.is_default.desc(), Address.created_at.desc()).all()
    return jsonify({'addresses': [a.to_dict() for a in addresses]}), 200


@addresses_bp.route('', methods=['POST'])
@jwt_required()
def create_address():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    required = ['full_name', 'phone', 'street', 'city', 'district', 'province']
    for field in required:
        if not data.get(field) or not str(data.get(field)).strip():
            return jsonify({'error': f'{field.replace("_", " ").capitalize()} is required'}), 400

    is_default = bool(data.get('is_default', False))
    # If this is the user's first address, make it default automatically
    existing_count = Address.query.filter_by(user_id=user_id).count()
    if existing_count == 0:
        is_default = True
    elif is_default:
        Address.query.filter_by(user_id=user_id).update({'is_default': False})

    address = Address(
        user_id=user_id,
        label=data.get('label', 'Home').strip() or 'Home',
        full_name=data['full_name'].strip(),
        phone=data['phone'].strip(),
        street=data['street'].strip(),
        city=data['city'].strip(),
        district=data['district'].strip(),
        province=data['province'].strip(),
        is_default=is_default
    )
    db.session.add(address)
    db.session.commit()

    return jsonify({'address': address.to_dict(), 'message': 'Address saved successfully'}), 201


@addresses_bp.route('/<int:address_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_address(address_id):
    user_id = int(get_jwt_identity())
    address = Address.query.filter_by(id=address_id, user_id=user_id).first()
    if not address:
        return jsonify({'error': 'Address not found or unauthorized'}), 404

    data = request.get_json() or {}
    if 'full_name' in data:
        if not str(data['full_name']).strip():
            return jsonify({'error': 'Full name cannot be empty'}), 400
        address.full_name = data['full_name'].strip()

    if 'phone' in data:
        if not str(data['phone']).strip():
            return jsonify({'error': 'Phone cannot be empty'}), 400
        address.phone = data['phone'].strip()

    if 'street' in data:
        if not str(data['street']).strip():
            return jsonify({'error': 'Street cannot be empty'}), 400
        address.street = data['street'].strip()

    if 'city' in data:
        address.city = str(data['city']).strip()
    if 'district' in data:
        address.district = str(data['district']).strip()
    if 'province' in data:
        address.province = str(data['province']).strip()
    if 'label' in data:
        address.label = str(data['label']).strip() or 'Home'

    if data.get('is_default'):
        Address.query.filter_by(user_id=user_id).update({'is_default': False})
        address.is_default = True

    db.session.commit()
    return jsonify({'address': address.to_dict(), 'message': 'Address updated successfully'}), 200


@addresses_bp.route('/<int:address_id>', methods=['DELETE'])
@jwt_required()
def delete_address(address_id):
    user_id = int(get_jwt_identity())
    address = Address.query.filter_by(id=address_id, user_id=user_id).first()
    if not address:
        return jsonify({'error': 'Address not found or unauthorized'}), 404

    was_default = address.is_default
    db.session.delete(address)
    db.session.commit()

    # If the default address was deleted, make the most recent remaining address default
    if was_default:
        next_addr = Address.query.filter_by(user_id=user_id).order_by(Address.created_at.desc()).first()
        if next_addr:
            next_addr.is_default = True
            db.session.commit()

    return jsonify({'message': 'Address deleted successfully'}), 200


@addresses_bp.route('/<int:address_id>/default', methods=['PATCH'])
@jwt_required()
def set_default_address(address_id):
    user_id = int(get_jwt_identity())
    address = Address.query.filter_by(id=address_id, user_id=user_id).first()
    if not address:
        return jsonify({'error': 'Address not found or unauthorized'}), 404

    Address.query.filter_by(user_id=user_id).update({'is_default': False})
    address.is_default = True
    db.session.commit()

    return jsonify({'address': address.to_dict(), 'message': 'Default address updated'}), 200
