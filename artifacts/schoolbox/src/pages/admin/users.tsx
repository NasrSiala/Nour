import { useState } from "react";
import { useListUsers, useDeactivateUser, useCreateUser, CreateUserBodyRole } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, UserX, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { QueryClient, useQueryClient } from "@tanstack/react-query";

export default function UserManagement() {
  const { data: users, isLoading } = useListUsers();
  const deactivateUser = useDeactivateUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDeactivate = async (id: number) => {
    try {
      await deactivateUser.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User deactivated successfully" });
    } catch (error) {
      toast({ title: "Failed to deactivate user", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <Button data-testid="button-create-user">
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 border-b">
                  <tr>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Username</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users?.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-medium">{user.fullName}</td>
                      <td className="px-6 py-4 text-gray-600">{user.username}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="capitalize">{user.role}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        {user.isActive ? (
                          <span className="flex items-center text-green-600 text-xs font-medium"><CheckCircle2 className="w-3 h-3 mr-1"/> Active</span>
                        ) : (
                          <span className="flex items-center text-gray-400 text-xs font-medium"><UserX className="w-3 h-3 mr-1"/> Inactive</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" data-testid={`button-user-actions-${user.id}`}>
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              className="text-red-600" 
                              onClick={() => handleDeactivate(user.id)}
                              disabled={!user.isActive || deactivateUser.isPending}
                            >
                              Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}