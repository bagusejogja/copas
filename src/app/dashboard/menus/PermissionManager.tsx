"use client";
import { useState, useEffect } from 'react';
import Select from 'react-select';

type Role = { id: number; nama_jabatan: string; level: number };
type Menu = { id: number; nama_menu: string; path: string };
type PermissionType = {
  menu_id: number;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
};

export default function PermissionManager({ initialRoles, initialMenus }: { initialRoles: Role[], initialMenus: Menu[] }) {
  const [selectedRole, setSelectedRole] = useState<number | null>(initialRoles[0]?.id || null);
  const [permissions, setPermissions] = useState<Record<number, PermissionType>>({});
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  // Fetch permissions for selected role
  useEffect(() => {
    if (!selectedRole) return;
    const fetchPermissions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/permissions?roleId=${selectedRole}`);
        const data = await res.json();
        
        // Convert array to record mapping menu_id -> permission
        const permMap: Record<number, PermissionType> = {};
        initialMenus.forEach(menu => {
           const existing = data.find((p: any) => p.menu_id === menu.id);
           permMap[menu.id] = existing || {
              menu_id: menu.id,
              can_create: false,
              can_read: false,
              can_update: false,
              can_delete: false
           };
        });
        setPermissions(permMap);
      } catch (err) {
        console.error('Failed to fetch permissions', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPermissions();
  }, [selectedRole, initialMenus]);

  const handleCheckboxChange = (menuId: number, field: keyof PermissionType) => {
    setPermissions(prev => ({
      ...prev,
      [menuId]: {
        ...prev[menuId],
        [field]: !prev[menuId][field]
      }
    }));
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      // transform mapping to array
      const permsArray = Object.values(permissions);
      const res = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: selectedRole, permissions: permsArray })
      });
      
      if (res.ok) {
        setSaveMessage('Hak akses berhasil disimpan!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Gagal menyimpan.');
      }
    } catch (err) {
      setSaveMessage('Terjadi kesalahan jaringan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      {/* Role Selector */}
      <div className="mb-8 max-w-sm">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Pilih Jabatan (Role)</label>
        {isMounted && (
          <Select
            instanceId="role-permission-select"
            placeholder="Cari Jabatan/Role..."
            options={initialRoles.map(r => ({ value: r.id, label: `${r.nama_jabatan} (Level ${r.level})` }))}
            value={selectedRole ? { value: selectedRole, label: initialRoles.find(r => r.id === selectedRole)?.nama_jabatan + ` (Level ${initialRoles.find(r => r.id === selectedRole)?.level})` } : null}
            onChange={(val: any) => setSelectedRole(val ? val.value : null)}
            className="text-sm"
            styles={{
              control: (base) => ({
                ...base,
                borderRadius: '0.5rem',
                borderColor: '#d1d5db',
                backgroundColor: '#f9fafb'
              })
            }}
          />
        )}
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-500">Memuat hak akses...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600 bg-white">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4">Nama Menu</th>
                <th scope="col" className="px-6 py-4 text-center bg-gray-100/50">Pilih Semua</th>
                <th scope="col" className="px-6 py-4 text-center">View / Read</th>
                <th scope="col" className="px-6 py-4 text-center">Create / Insert</th>
                <th scope="col" className="px-6 py-4 text-center">Update / Edit</th>
                <th scope="col" className="px-6 py-4 text-center">Delete</th>
              </tr>
            </thead>
            <tbody>
              {initialMenus.map(menu => {
                const p = permissions[menu.id] || { can_read: false, can_create: false, can_update: false, can_delete: false };
                const isAllSelected = p.can_read && p.can_create && p.can_update && p.can_delete;
                
                const handleToggleRow = () => {
                  const target = !isAllSelected;
                  setPermissions(prev => ({
                    ...prev,
                    [menu.id]: {
                      ...prev[menu.id],
                      can_read: target,
                      can_create: target,
                      can_update: target,
                      can_delete: target
                    }
                  }));
                };

                return (
                  <tr key={menu.id} className="border-b transition hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                       {menu.nama_menu}
                       <span className="block text-xs font-normal text-gray-400 mt-0.5">{menu.path}</span>
                    </td>
                    <td className="px-6 py-4 text-center bg-gray-50/50 border-r border-l">
                       <input 
                         type="checkbox" 
                         checked={isAllSelected} 
                         onChange={handleToggleRow} 
                         className="w-5 h-5 text-muh-green bg-white border-gray-300 rounded focus:ring-muh-green focus:ring-2 cursor-pointer transition-all hover:scale-110" 
                       />
                    </td>
                    <td className="px-6 py-4 text-center relative w-24">
                       <input type="checkbox" checked={p.can_read} onChange={() => handleCheckboxChange(menu.id, 'can_read')} className="w-5 h-5 text-muh-green bg-gray-100 border-gray-300 rounded focus:ring-muh-green focus:ring-2 cursor-pointer transition-transform hover:scale-110" />
                    </td>
                    <td className="px-6 py-4 text-center relative w-24">
                       <input type="checkbox" checked={p.can_create} onChange={() => handleCheckboxChange(menu.id, 'can_create')} className="w-5 h-5 text-muh-green bg-gray-100 border-gray-300 rounded focus:ring-muh-green focus:ring-2 cursor-pointer transition-transform hover:scale-110" />
                    </td>
                    <td className="px-6 py-4 text-center relative w-24">
                       <input type="checkbox" checked={p.can_update} onChange={() => handleCheckboxChange(menu.id, 'can_update')} className="w-5 h-5 text-muh-green bg-gray-100 border-gray-300 rounded focus:ring-muh-green focus:ring-2 cursor-pointer transition-transform hover:scale-110" />
                    </td>
                    <td className="px-6 py-4 text-center relative w-24">
                       <input type="checkbox" checked={p.can_delete} onChange={() => handleCheckboxChange(menu.id, 'can_delete')} className="w-5 h-5 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2 cursor-pointer transition-transform hover:scale-110" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          <div className="mt-8 flex items-center gap-4">
             <button
               onClick={handleSave}
               disabled={isSaving}
               className={`px-6 py-2.5 bg-muh-green text-white font-semibold rounded-lg shadow-md hover:bg-muh-green-dark focus:ring-4 focus:ring-muh-green-light transition-all ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
             >
               {isSaving ? 'Menyimpan...' : 'Simpan Hak Akses'}
             </button>
             {saveMessage && (
               <span className={`text-sm font-medium ${saveMessage.includes('berhasil') ? 'text-green-600' : 'text-red-500'}`}>
                 {saveMessage}
               </span>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
