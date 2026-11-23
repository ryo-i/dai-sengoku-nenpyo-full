/**
 * Person のドメイン型。
 * 永続化と API レスポンスで同じ形を使います。
 */
export type Person = {
  id: number;
  name: string;
};
