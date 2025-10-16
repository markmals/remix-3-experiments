export async function getPost(id: number) {
	return { title: "A Post", content: "Post content" };
}

export async function getPosts() {
	return [
		{ title: "A Post", id: 1 },
		{ title: "Another Post", id: 2 },
	];
}
