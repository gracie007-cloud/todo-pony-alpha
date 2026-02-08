"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  CalendarDays, 
  CheckCircle2, 
  Inbox, 
  ListTodo,
  Settings,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarSection, SidebarDivider } from "./SidebarSection";
import { ViewItem } from "./ViewItem";
import { ListView } from "./ListView";
import { LabelItem } from "./LabelItem";
import { AddListButton } from "./AddListButton";
import { useLists, useLabels, useTodayTasks, useWeekTasks, useAllTasks, useCompletedTasks } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import type { ViewType, ListWithTaskCount, Label } from "@/lib/types";

interface SidebarContentProps {
  isCollapsed?: boolean;
  onItemClick?: () => void;
}

export function SidebarContent({
  isCollapsed = false,
  onItemClick,
}: SidebarContentProps) {
  // Fetch data
  const { lists, isLoading: listsLoading } = useLists();
  const { labels, isLoading: labelsLoading } = useLabels();
  const { tasks: todayTasks } = useTodayTasks();
  const { tasks: weekTasks } = useWeekTasks();
  const { tasks: allTasks } = useAllTasks();
  const { tasks: completedTasks } = useCompletedTasks();

  // Get state from store
  const {
    activeView,
    activeListId,
    activeLabelId,
    setActiveView,
    setActiveList,
    setActiveLabel,
    openListDialog,
    openLabelDialog,
  } = useAppStore();

  // Calculate task counts
  const taskCounts = React.useMemo(() => ({
    today: todayTasks.filter(t => !t.completed).length,
    next7days: weekTasks.filter(t => !t.completed).length,
    all: allTasks.filter(t => !t.completed).length,
    completed: completedTasks.length,
    inbox: 0, // Will be calculated based on inbox list
  }), [todayTasks, weekTasks, allTasks, completedTasks]);

  // Calculate label counts
  const labelCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    allTasks.forEach(task => {
      task.labels?.forEach(label => {
        counts[label.id] = (counts[label.id] || 0) + 1;
      });
    });
    return counts;
  }, [allTasks]);

  const handleViewClick = (view: ViewType) => {
    setActiveView(view);
    onItemClick?.();
  };

  const handleListClick = (listId: string) => {
    setActiveList(listId);
    onItemClick?.();
  };

  const handleLabelClick = (labelId: string) => {
    setActiveLabel(labelId);
    onItemClick?.();
  };

  const handleAddList = () => {
    openListDialog("create");
  };

  const handleAddLabel = () => {
    openLabelDialog("create");
  };

  const handleEditList = (id: string) => {
    openListDialog("edit", id);
  };

  const handleEditLabel = (id: string) => {
    openLabelDialog("edit", id);
  };

  return (
    <ScrollArea className="h-full scrollbar-thin">
      <div className="py-2">
        {/* Main Views */}
        <SidebarSection isCollapsed={isCollapsed}>
          <ViewItem
            id="today"
            label="Today"
            icon={Calendar}
            count={taskCounts.today}
            isActive={activeView === "today" && !activeListId && !activeLabelId}
            isCollapsed={isCollapsed}
            onClick={() => handleViewClick("today")}
          />
          <ViewItem
            id="next7days"
            label="Next 7 Days"
            icon={CalendarDays}
            count={taskCounts.next7days}
            isActive={activeView === "next7days" && !activeListId && !activeLabelId}
            isCollapsed={isCollapsed}
            onClick={() => handleViewClick("next7days")}
          />
          <ViewItem
            id="all"
            label="All Tasks"
            icon={ListTodo}
            count={taskCounts.all}
            isActive={activeView === "all" && !activeListId && !activeLabelId}
            isCollapsed={isCollapsed}
            onClick={() => handleViewClick("all")}
          />
          <ViewItem
            id="inbox"
            label="Inbox"
            icon={Inbox}
            count={taskCounts.inbox}
            isActive={activeView === "inbox" && !activeListId && !activeLabelId}
            isCollapsed={isCollapsed}
            onClick={() => handleViewClick("inbox")}
          />
          <ViewItem
            id="completed"
            label="Completed"
            icon={CheckCircle2}
            count={taskCounts.completed}
            isActive={activeView === "completed" && !activeListId && !activeLabelId}
            isCollapsed={isCollapsed}
            onClick={() => handleViewClick("completed")}
          />
        </SidebarSection>

        <SidebarDivider />

        {/* Lists */}
        <SidebarSection
          title="Lists"
          isCollapsed={isCollapsed}
          onAddClick={handleAddList}
          addLabel="Add list"
        >
          {listsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {lists.map((list) => (
                <ListView
                  key={list.id}
                  list={list}
                  isActive={activeListId === list.id}
                  isCollapsed={isCollapsed}
                  onClick={() => handleListClick(list.id)}
                  onEdit={handleEditList}
                />
              ))}
              {!isCollapsed && lists.length === 0 && (
                <AddListButton onClick={handleAddList} />
              )}
            </>
          )}
        </SidebarSection>

        <SidebarDivider />

        {/* Labels */}
        <SidebarSection
          title="Labels"
          isCollapsed={isCollapsed}
          onAddClick={handleAddLabel}
          addLabel="Add label"
        >
          {labelsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {labels.map((label) => (
                <LabelItem
                  key={label.id}
                  label={label}
                  count={labelCounts[label.id] || 0}
                  isActive={activeLabelId === label.id}
                  isCollapsed={isCollapsed}
                  onClick={() => handleLabelClick(label.id)}
                  onEdit={handleEditLabel}
                />
              ))}
              {!isCollapsed && labels.length === 0 && (
                <AddListButton variant="label" onClick={handleAddLabel} />
              )}
            </>
          )}
        </SidebarSection>

        {/* Bottom actions (only when expanded) */}
        {!isCollapsed && (
          <>
            <SidebarDivider />
            <div className="px-2 py-2 space-y-1">
              <motion.button
                whileHover={{ x: 2 }}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
              >
                <Settings className="size-4" />
                <span className="text-sm">Settings</span>
              </motion.button>
              <motion.button
                whileHover={{ x: 2 }}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
              >
                <HelpCircle className="size-4" />
                <span className="text-sm">Help & Feedback</span>
              </motion.button>
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
