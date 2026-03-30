'use client';

import { useMemo, useState } from 'react';
import { Input } from '@smart/components/ui/input';
import { Button } from '@smart/components/ui/button';
import { useFeedStore } from '@smart/store/feed';
import { SendHorizonal } from 'lucide-react';

export default function CommentComposer({ postId }: { postId: string }) {
  const [value, setValue] = useState('');
  const addComment = useFeedStore((s) => s.addComment);

  const canSend = useMemo(() => value.trim().length > 0, [value]);

  return (
    <div className="flex items-center gap-2">
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
  );
}

