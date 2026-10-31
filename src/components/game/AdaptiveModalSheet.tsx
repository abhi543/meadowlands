'use client';

import React from 'react';
import { useDeviceProfile } from '@/hooks/useDeviceProfile';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface AdaptiveModalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export function AdaptiveModalSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidthClass = 'max-w-2xl',
}: AdaptiveModalSheetProps) {
  const { isMobileDevice } = useDeviceProfile();

  if (isMobileDevice) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] rounded-t-3xl p-4 bg-stone-900 border-stone-700 text-stone-100 flex flex-col overflow-hidden"
        >
          {/* Top Drag Handle Indicator */}
          <div className="w-12 h-1.5 rounded-full bg-stone-600 mx-auto mb-2 flex-shrink-0" />

          <SheetHeader className="p-0 border-b border-stone-800 pb-3 flex-shrink-0">
            <SheetTitle className="text-base font-bold text-stone-100 flex items-center gap-2">
              {title}
            </SheetTitle>
            {description && (
              <SheetDescription className="text-xs text-stone-400">
                {description}
              </SheetDescription>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto game-scroll py-3 text-sm">
            {children}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`${maxWidthClass} max-h-[88vh] bg-stone-900 border-stone-700 text-stone-100 p-6 flex flex-col shadow-2xl rounded-2xl`}
      >
        <DialogHeader className="border-b border-stone-800 pb-3 flex-shrink-0">
          <DialogTitle className="text-lg font-bold text-stone-100 flex items-center gap-2">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-xs text-stone-400">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto game-scroll py-4 text-sm">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
