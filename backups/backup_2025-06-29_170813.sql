--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (Debian 17.5-1.pgdg120+1)
-- Dumped by pg_dump version 17.5 (Debian 17.5-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.images (
    id integer NOT NULL,
    filename text NOT NULL,
    original_name text NOT NULL,
    size integer NOT NULL,
    upload_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    file_type text NOT NULL
);


ALTER TABLE public.images OWNER TO postgres;

--
-- Name: images_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.images_id_seq OWNER TO postgres;

--
-- Name: images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.images_id_seq OWNED BY public.images.id;


--
-- Name: images id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.images ALTER COLUMN id SET DEFAULT nextval('public.images_id_seq'::regclass);


--
-- Data for Name: images; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.images (id, filename, original_name, size, upload_time, file_type) FROM stdin;
8	55801138acfb40e0.jpg	43522c42-449a-4764-a35c-93eca75f300a.jpg	52117	2025-06-29 13:34:28.134482	jpg
9	5c216ca699b849b7.jpg	43522c42-449a-4764-a35c-93eca75f300a.jpg	52117	2025-06-29 13:34:38.233824	jpg
11	bc2be0f3e50844e8.jpg	43522c42-449a-4764-a35c-93eca75f300a.jpg	52117	2025-06-29 13:34:53.093327	jpg
13	0d2eb22be6b64696.jpg	43522c42-449a-4764-a35c-93eca75f300a.jpg	52117	2025-06-29 13:35:02.444149	jpg
14	b66e564d6c6d4325.jpg	43522c42-449a-4764-a35c-93eca75f300a.jpg	52117	2025-06-29 13:35:07.204651	jpg
15	530108bb053d4e9d.jpg	43522c42-449a-4764-a35c-93eca75f300a.jpg	52117	2025-06-29 13:35:14.013404	jpg
16	fc82cd0cf4d24ab4.jpg	43522c42-449a-4764-a35c-93eca75f300a.jpg	52117	2025-06-29 13:35:19.301297	jpg
17	47714fcee9fe436f.jpg	43522c42-449a-4764-a35c-93eca75f300a.jpg	52117	2025-06-29 13:35:23.747897	jpg
18	280ba4ba3e734b08.jpg	43522c42-449a-4764-a35c-93eca75f300a.jpg	52117	2025-06-29 13:35:28.772251	jpg
19	845c0671f7df48dd.jpg	43522c42-449a-4764-a35c-93eca75f300a.jpg	52117	2025-06-29 13:35:33.628411	jpg
20	183d8cf67a3e4fed.jpg	43522c42-449a-4764-a35c-93eca75f300a.jpg	52117	2025-06-29 13:57:40.745634	jpg
\.


--
-- Name: images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.images_id_seq', 20, true);


--
-- Name: images images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT images_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

