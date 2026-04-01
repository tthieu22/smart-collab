'use client';

import { useMemo, useState } from 'react';
import { Input } from '@smart/components/ui/input';
import { Button } from '@smart/components/ui/button';
import { useFeedStore } from '@smart/store/feed';
import { useShallow } from 'zustand/react/shallow';
import { SendHorizonal } from 'lucide-react';

export default function CommentComposer({ postId }: { postId: string }) {
  const [value, setValue] = useState('');
  const { addComment, me } = useFeedStore(
    useShallow((s) => ({
      addComment: s.addComment,
      me: s.currentUserId ? s.users[s.currentUserId] : null,
    }))
  );

  const canSend = useMemo(() => value.trim().length > 0, [value]);

  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-800 shrink-0 mt-1">
        {me?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={me.avatarUrl} alt={me.name} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="flex-1 flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Viết bình luận..."
          variant="filled"
          className="flex-1"
          onPressEnter={() => {
            if (!canSend) return;
            addComment(postId, value.trim());
            setValue('');
          }}
        />
        <Button
          variant="primary"
          size="small"
          disabled={!canSend}
          onClick={() => {
            addComment(postId, value.trim());
            setValue('');
          }}
          className="gap-2"
        >
          <SendHorizonal size={16} />
          Gửi
        </Button>
      </div>
    </div>
  );
}
