import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Colors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiRequest } from '@/lib/api';

interface Post {
  id: string;
  body: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  like_count: number;
  comment_count: number;
}

export default function CommunityScreen() {
  const theme = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [body, setBody] = useState('');
  const [comments, setComments] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const loadPosts = useCallback(async () => {
    const response = await apiRequest<{ posts: Post[] }>('/community');
    setPosts(response.posts);
  }, []);

  useEffect(() => {
    apiRequest<{ posts: Post[] }>('/community')
      .then((response) => setPosts(response.posts))
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Unable to load community feed'));
  }, []);

  async function createPost() {
    try {
      await apiRequest('/community', { method: 'POST', body: JSON.stringify({ body }) });
      setBody('');
      await loadPosts();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to publish post');
    }
  }

  async function toggleLike(postId: string) {
    try {
      await apiRequest(`/community/${postId}/likes`, { method: 'POST' });
      await loadPosts();
    } catch (likeError) {
      setError(likeError instanceof Error ? likeError.message : 'Unable to update like');
    }
  }

  async function addComment(postId: string) {
    const comment = comments[postId]?.trim();
    if (!comment) return;
    try {
      await apiRequest(`/community/${postId}/comments`, { method: 'POST', body: JSON.stringify({ body: comment }) });
      setComments((current) => ({ ...current, [postId]: '' }));
      await loadPosts();
    } catch (commentError) {
      setError(commentError instanceof Error ? commentError.message : 'Unable to add comment');
    }
  }

  return (
    <AppScreen title="Community" subtitle="Share a discovery or learn from other farmers.">
      <View style={[styles.composer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <TextInput value={body} onChangeText={setBody} multiline maxLength={5000} placeholder="What are you learning on your farm?" style={styles.postInput} />
        <PrimaryButton onPress={createPost} disabled={!body.trim()}>Share post</PrimaryButton>
      </View>
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      {!posts.length && !error ? <ThemedText themeColor="textSecondary">No posts yet. Start the conversation.</ThemedText> : null}
      {posts.map((post) => (
        <View key={post.id} style={[styles.post, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.author}>
            {post.avatar_url ? <Image source={{ uri: post.avatar_url }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarFallback]}><ThemedText type="smallBold">{post.display_name.slice(0, 1)}</ThemedText></View>}
            <View style={styles.authorCopy}>
              <ThemedText type="smallBold">{post.display_name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">{new Date(post.created_at).toLocaleDateString()}</ThemedText>
            </View>
          </View>
          <ThemedText>{post.body}</ThemedText>
          {post.image_url ? <Image source={{ uri: post.image_url }} contentFit="cover" style={styles.postImage} /> : null}
          <View style={styles.actions}>
            <Pressable onPress={() => toggleLike(post.id)}><ThemedText type="smallBold" style={{ color: theme.primary }}>♥ {post.like_count} likes</ThemedText></Pressable>
            <ThemedText type="small" themeColor="textSecondary">{post.comment_count} comments</ThemedText>
          </View>
          <View style={styles.commentForm}>
            <TextInput
              value={comments[post.id] ?? ''}
              onChangeText={(value) => setComments((current) => ({ ...current, [post.id]: value }))}
              placeholder="Add a comment"
              style={styles.commentInput}
            />
            <Pressable onPress={() => addComment(post.id)}><ThemedText type="smallBold" style={{ color: theme.primary }}>Send</ThemedText></Pressable>
          </View>
        </View>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  composer: { padding: Spacing.three, gap: Spacing.two, borderRadius: 18, borderWidth: 1 },
  postInput: { minHeight: 72, textAlignVertical: 'top', color: Colors.light.text },
  post: { padding: Spacing.three, gap: Spacing.two, borderRadius: 18, borderWidth: 1 },
  author: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  avatarFallback: { backgroundColor: '#E3F2DE', alignItems: 'center', justifyContent: 'center' },
  authorCopy: { gap: 2 },
  postImage: { width: '100%', height: 200, borderRadius: 14 },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  commentForm: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.light.border, paddingTop: Spacing.two },
  commentInput: { flex: 1, paddingVertical: Spacing.one, color: Colors.light.text },
  error: { color: '#B3261E' },
});
