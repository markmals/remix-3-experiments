export interface TraktAirDate {
    airs: {
        day: string;
        time: string;
        timezone: string;
    };
}

export interface SearchResult {
    type: string;
    score: number;
}

export interface MovieSearchResult extends SearchResult {
    movie: Movie;
}

export interface ShowSearchResult extends SearchResult {
    show: Movie;
}

export interface EpisodeSearchResult extends SearchResult {
    episode: Episode;
}

export interface PersonSearchResult extends SearchResult {
    person: Person;
}

export interface ListSearchResult extends SearchResult {
    list: List;
}

export interface Episode {
    season: number;
    number: number;
    title: string;
    ids: EpisodeIds;
}

export interface EpisodeIds {
    trakt: number;
    tvdb?: number;
    imdb: null | string;
    tmdb: number;
    slug?: string;
}

export interface List {
    name: string;
    description: string;
    privacy: string;
    share_link: string;
    type: string;
    display_numbers: boolean;
    allow_comments: boolean;
    sort_by: string;
    sort_how: string;
    created_at: Date;
    updated_at: Date;
    item_count: number;
    comment_count: number;
    likes: number;
    ids: ListIds;
    user: User;
}

export interface ListIds {
    trakt: number;
    slug: string;
}

export interface User {
    username: string;
    private: boolean;
    name: string;
    vip: boolean;
    vip_ep: boolean;
    ids: UserIds;
}

export interface UserIds {
    slug: string;
}

export interface Show {
    title: string;
    year: number;
    ids: EpisodeIds;
}

export interface Movie extends Show {}

export interface Person {
    name: string;
    ids: EpisodeIds;
}
