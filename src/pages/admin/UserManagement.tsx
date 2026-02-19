import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Profile } from '@/types/database.types';

const UserManagement = () => {
    const queryClient = useQueryClient();

    const { data: profiles, isLoading } = useQuery({
        queryKey: ['profiles'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Profile[];
        }
    });

    const updateRoleMutation = useMutation({
        mutationFn: async ({ id, role }: { id: string; role: 'admin' | 'user' }) => {
            const { error } = await supabase
                .from('profiles')
                .update({ role })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            toast.success('Role updated successfully');
        },
        onError: (error) => {
            console.error('Error updating role:', error);
            toast.error('Failed to update role');
        }
    });

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Manajemen User</h1>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Bergabung</TableHead>
                            <TableHead className="w-[120px]">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {profiles?.map((profile) => (
                            <TableRow key={profile.id}>
                                <TableCell>{profile.email}</TableCell>
                                <TableCell>
                                    <span className={`capitalize ${profile.role === 'admin' ? 'font-bold text-primary' : ''}`}>
                                        {profile.role}
                                    </span>
                                </TableCell>
                                <TableCell>{new Date(profile.created_at).toLocaleDateString('id-ID')}</TableCell>
                                <TableCell>
                                    <Select
                                        defaultValue={profile.role}
                                        onValueChange={(value) => updateRoleMutation.mutate({ id: profile.id, role: value as 'admin' | 'user' })}
                                        disabled={updateRoleMutation.isPending}
                                    >
                                        <SelectTrigger className="w-[110px]">
                                            <SelectValue placeholder="Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="user">User</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default UserManagement;
