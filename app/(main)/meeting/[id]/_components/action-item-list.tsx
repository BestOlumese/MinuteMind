"use client";

import React, { useState, useRef, useOptimistic, startTransition } from "react";
import { format, isPast, isToday } from "date-fns";
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Trash2, 
  User as UserIcon,
  Check,
  X,
  Lock // Added lock icon for read-only view
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { createActionItem, deleteActionItem, updateActionItem } from "@/actions/meeting";

// --- TYPES ---
interface Member {
  id: string;
  name: string | null;
  image: string | null;
}

interface ActionItem {
  id: string;
  task: string;
  isCompleted: boolean;
  dueDate: Date | null;
  assigneeId: string | null;
}

interface ActionItemListProps {
  meetingId: string;
  initialItems: ActionItem[];
  members: Member[];
  currentUserRole: string; // <--- NEW PROP
}

export function ActionItemList({ meetingId, initialItems, members, currentUserRole }: ActionItemListProps) {
  const [newTask, setNewTask] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // Check permissions: Only OWNER and ADMIN can edit
  const canEdit = currentUserRole === "owner" || currentUserRole === "admin";

  const [items, addOptimisticItem] = useOptimistic(
    initialItems,
    (state, action: { type: string; payload: any }) => {
      switch (action.type) {
        case "ADD": return [...state, action.payload];
        case "UPDATE": return state.map((i) => (i.id === action.payload.id ? { ...i, ...action.payload.data } : i));
        case "DELETE": return state.filter((i) => i.id !== action.payload);
        default: return state;
      }
    }
  );

  async function handleCreate(formData: FormData) {
    if (!canEdit) return; // double check

    const taskText = newTask.trim();
    if (!taskText) return;

    setNewTask("");
    
    const tempId = `temp-${Date.now()}`;
    startTransition(() => {
      addOptimisticItem({ 
        type: "ADD", 
        payload: { id: tempId, task: taskText, isCompleted: false, dueDate: null, assigneeId: null } 
      });
    });

    try {
      await createActionItem(meetingId, taskText);
    } catch (e) {
      toast.error("Failed to save item");
    }
  }

  const updateItem = async (id: string, data: Partial<ActionItem>) => {
    if (!canEdit) return; // Prevent updates if not authorized

    startTransition(() => {
      addOptimisticItem({ type: "UPDATE", payload: { id, data } });
    });
    try { await updateActionItem(id, data); } catch (e) { toast.error("Update failed"); }
  };

  const deleteItem = async (id: string) => {
    if (!canEdit) return;

    startTransition(() => {
      addOptimisticItem({ type: "DELETE", payload: id });
    });
    await deleteActionItem(id);
  };

  return (
    <div className="flex flex-col gap-1">
      {items.length === 0 && (
        <p className="text-sm text-gray-400 italic px-2 py-4 text-center">
           {canEdit ? "No action items yet. Add one below." : "No action items assigned."}
        </p>
      )}

      {/* ITEMS LIST */}
      <div className="flex flex-col">
        {items.map((item) => (
          <ActionItemRow 
            key={item.id} 
            item={item} 
            members={members} 
            canEdit={canEdit} // Pass permission down
            onUpdate={updateItem}
            onDelete={deleteItem}
          />
        ))}
      </div>

      {/* CREATE INPUT - ONLY FOR ADMIN/OWNER */}
      {canEdit && (
        <form action={handleCreate} ref={formRef} className="group flex items-center gap-3 px-2 py-2 mt-2 -ml-2 rounded-md hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-center w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors">
            <Plus className="w-4 h-4" />
            </div>
            <Input 
                placeholder="New action item..." 
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="h-auto p-1 border-none shadow-none focus-visible:ring-0 bg-transparent text-sm placeholder:text-gray-400"
            />
        </form>
      )}
    </div>
  );
}

// --- ROW COMPONENT ---
function ActionItemRow({ 
  item, 
  members,
  canEdit, // Received prop 
  onUpdate, 
  onDelete 
}: { 
  item: ActionItem; 
  members: Member[]; 
  canEdit: boolean;
  onUpdate: (id: string, data: Partial<ActionItem>) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(item.task);
  const inputRef = useRef<HTMLInputElement>(null);
  const assignee = members.find((m) => m.id === item.assigneeId);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const saveTask = () => {
    setIsEditing(false);
    if (editedTask.trim() !== item.task) {
      onUpdate(item.id, { task: editedTask });
    }
  };

  const getDateColor = (date: Date) => {
    if (item.isCompleted) return "text-gray-400";
    if (isPast(date) && !isToday(date)) return "text-red-500 font-medium";
    if (isToday(date)) return "text-orange-500 font-medium";
    return "text-gray-500";
  };

  return (
    <div className="group flex items-start gap-3 px-2 py-2 -mx-2 rounded-md hover:bg-gray-50 transition-all duration-200">
      
      {/* 1. CHECKBOX */}
      <div className="mt-0.5">
        <Checkbox 
          checked={item.isCompleted} 
          disabled={!canEdit} // Disable for normal members
          onCheckedChange={(checked) => canEdit && onUpdate(item.id, { isCompleted: !!checked })}
          className={cn(
            "w-4 h-4 border-gray-300 transition-all",
            canEdit ? "data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600" : "cursor-not-allowed opacity-70"
          )}
        />
      </div>
      
      {/* 2. TASK CONTENT */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {isEditing && canEdit ? (
          <Input 
            ref={inputRef}
            value={editedTask}
            onChange={(e) => setEditedTask(e.target.value)}
            onBlur={saveTask}
            onKeyDown={(e) => e.key === "Enter" && saveTask()}
            className="h-auto p-0 text-sm border-none focus-visible:ring-0 bg-transparent -ml-px"
          />
        ) : (
          <span 
            onClick={() => canEdit && setIsEditing(true)}
            className={cn(
              "text-sm wrap-break-word transition-colors leading-relaxed",
              canEdit ? "cursor-text" : "cursor-default",
              item.isCompleted ? "text-gray-400 line-through decoration-gray-300" : "text-gray-700"
            )}
          >
            {item.task}
          </span>
        )}
      </div>

      {/* 3. ACTIONS (Hidden entirely if not allowed to edit, except to SHOW assigned state) */}
      <div className={cn(
        "flex items-center gap-1 transition-opacity duration-200",
        // If user can't edit, we show the badges permanently (opacity 100) but they are not interactive
        canEdit ? "opacity-0 group-hover:opacity-100" : "opacity-100" 
      )}>
        
        {/* ASSIGNEE */}
        {canEdit ? (
            // --- EDITABLE POPOVER ---
            <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className={cn("h-6 w-6 p-0 rounded-full", assignee ? "opacity-100" : "opacity-0 group-hover:opacity-100")} title="Assign">
                {assignee ? (
                    <Avatar className="w-5 h-5 border border-white shadow-sm ring-1 ring-gray-100">
                        <AvatarImage src={assignee.image || ""} />
                        <AvatarFallback className="text-[9px] bg-indigo-50 text-indigo-600 font-bold">{assignee.name?.substring(0,1)}</AvatarFallback>
                    </Avatar>
                ) : (
                    <UserIcon className="w-3.5 h-3.5 text-gray-400 hover:text-indigo-600" />
                )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[180px]" align="end">
                <Command>
                <CommandInput placeholder="Assign..." className="h-8 text-xs" />
                <CommandList>
                    <CommandEmpty>No members.</CommandEmpty>
                    <CommandGroup>
                    <CommandItem onSelect={() => onUpdate(item.id, { assigneeId: null })} className="text-xs">
                        <div className="flex items-center gap-2 text-gray-500"><X className="w-3 h-3" /> Unassign</div>
                    </CommandItem>
                    {members.map(member => (
                        <CommandItem key={member.id} onSelect={() => onUpdate(item.id, { assigneeId: member.id })} className="text-xs">
                        <div className="flex items-center gap-2">
                            <Avatar className="w-4 h-4">
                            <AvatarImage src={member.image || ""} />
                            <AvatarFallback className="text-[6px]">{member.name?.substring(0,1)}</AvatarFallback>
                            </Avatar>
                            <span className="truncate">{member.name?.split(" ")[0]}</span>
                            {item.assigneeId === member.id && <Check className="ml-auto w-3 h-3 text-indigo-600" />}
                        </div>
                        </CommandItem>
                    ))}
                    </CommandGroup>
                </CommandList>
                </Command>
            </PopoverContent>
            </Popover>
        ) : (
            // --- READ ONLY VIEW FOR MEMBERS ---
            assignee && (
                <div title={`Assigned to ${assignee.name}`}>
                    <Avatar className="w-5 h-5 border border-white shadow-sm ring-1 ring-gray-100">
                        <AvatarImage src={assignee.image || ""} />
                        <AvatarFallback className="text-[9px] bg-indigo-50 text-indigo-600 font-bold">{assignee.name?.substring(0,1)}</AvatarFallback>
                    </Avatar>
                </div>
            )
        )}

        {/* DATE */}
        {canEdit ? (
            // --- EDITABLE POPOVER ---
            <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" 
                    className={cn(
                        "h-6 px-1.5 text-[11px] rounded transition-all",
                        item.dueDate ? `opacity-100 ${getDateColor(new Date(item.dueDate))} bg-gray-50` : "opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600"
                    )}>
                {item.dueDate ? <span>{format(new Date(item.dueDate), "MMM d")}</span> : <CalendarIcon className="w-3.5 h-3.5" />}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={item.dueDate ? new Date(item.dueDate) : undefined} onSelect={(date) => onUpdate(item.id, { dueDate: date || null })} initialFocus />
            </PopoverContent>
            </Popover>
        ) : (
            // --- READ ONLY DATE ---
            item.dueDate && (
                <span className={cn("text-[11px] px-1.5 py-0.5 rounded bg-gray-50", getDateColor(new Date(item.dueDate)))}>
                    {format(new Date(item.dueDate), "MMM d")}
                </span>
            )
        )}

        {/* DELETE - ONLY FOR ADMIN/OWNER */}
        {canEdit && (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded" onClick={() => onDelete(item.id)}>
                <Trash2 className="w-3.5 h-3.5" />
            </Button>
        )}

      </div>
    </div>
  );
}