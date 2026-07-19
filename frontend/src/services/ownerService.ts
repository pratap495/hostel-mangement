import store from '../redux/store';
import { addOwner, editOwner, toggleOwnerActive, assignHostelsToOwner, setOwners } from '../redux/slices/ownersSlice';
import { addLog } from '../redux/slices/logsSlice';
import { Owner } from '../types';
import apiClient from './apiClient';

export const ownerService = {
  getOwners: async (): Promise<Owner[]> => {
    try {
      const response = await apiClient.get('/tenants/owners');
      const owners: Owner[] = response.data.map((o: any) => ({
        id: o.id,
        name: o.name,
        email: o.email,
        phone: o.phone,
        isActive: o.is_active,
        hostelsAssigned: o.hostels_assigned,
        photoUrl: o.photo_url || null
      }));
      store.dispatch(setOwners(owners));
      return owners;
    } catch (error: any) {
      console.error('Failed to get owners:', error);
      return store.getState().owners.owners;
    }
  },

  createOwner: async (owner: Omit<Owner, 'id'> & { password?: string }): Promise<void> => {
    try {
      const response = await apiClient.post('/tenants/owners', {
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        password: owner.password,
        photo_url: owner.photoUrl
      });
      
      const createdOwner: Owner = {
        id: response.data.owner_id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        isActive: true,
        hostelsAssigned: owner.hostelsAssigned,
        photoUrl: owner.photoUrl || null
      };

      store.dispatch(addOwner(createdOwner));
      
      const admin = store.getState().auth.user;
      store.dispatch(addLog({
        userId: admin?.id || 'system',
        userName: admin?.name || 'Admin',
        action: `Created new Owner account: ${owner.name}`,
      }));
    } catch (error: any) {
      const errMsg = error.response?.data?.detail || error.message || 'Failed to create owner';
      throw new Error(errMsg);
    }
  },

  updateOwner: async (owner: Owner): Promise<void> => {
    try {
      await apiClient.put(`/tenants/owners/${owner.id}`, {
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        photo_url: owner.photoUrl
      });
      
      store.dispatch(editOwner(owner));
      
      const admin = store.getState().auth.user;
      store.dispatch(addLog({
        userId: admin?.id || 'system',
        userName: admin?.name || 'Admin',
        action: `Updated Owner profile: ${owner.name}`,
      }));
    } catch (error: any) {
      const errMsg = error.response?.data?.detail || error.message || 'Failed to update owner';
      throw new Error(errMsg);
    }
  },

  toggleOwnerStatus: async (ownerId: string): Promise<void> => {
    try {
      const owner = store.getState().owners.owners.find(o => o.id === ownerId);
      if (owner) {
        const action = owner.isActive ? 'disable' : 'enable';
        await apiClient.put(`/tenants/owners/${ownerId}/status`, { action });
        
        store.dispatch(toggleOwnerActive(ownerId));
        
        const admin = store.getState().auth.user;
        store.dispatch(addLog({
          userId: admin?.id || 'system',
          userName: admin?.name || 'Admin',
          action: `${owner.isActive ? 'Disabled' : 'Enabled'} access for Owner: ${owner.name}`,
        }));
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.detail || error.message || 'Failed to toggle owner status';
      throw new Error(errMsg);
    }
  },

  assignHostels: async (ownerId: string, hostelIds: string[]): Promise<void> => {
    // Association is done during hostel creation, update Redux context
    store.dispatch(assignHostelsToOwner({ ownerId, hostelIds }));
    
    const owner = store.getState().owners.owners.find(o => o.id === ownerId);
    const admin = store.getState().auth.user;
    store.dispatch(addLog({
      userId: admin?.id || 'system',
      userName: admin?.name || 'Admin',
      action: `Updated hostel assignments for Owner ${owner?.name || ownerId}`,
    }));
  }
};
