export const PROJECT_DOSSIERS = {
cdas: {
mission:
"Centralized fragmented missing-persons records into a national search interface for families, search collectives, and human-rights organizations operating with incomplete data.",
architecture: [
"Full-stack platform built with Python, FastAPI, PostgreSQL, React, and AWS ECS/Fargate.",
"Distributed scraper scheduler with dynamic interval tuning, exponential backoff, and shard-based source partitioning.",
"Hybrid search layer combining Spanish-aware Levenshtein fuzzy matching with AWS Rekognition photo-to-record matching.",
],
coreOperations: [
"Centralized 10,000+ records from 40+ heterogeneous public sources into a searchable PostgreSQL-backed system.",
"Built ingestion routines for HTML, PDF, and image sources with parallel processing and fault-tolerant extraction.",
"Optimized incomplete-name search and photo matching for users lacking exact identifiers or clean source data.",
],
metrics: [
"10,000+ records centralized",
"40+ fragmented sources",
"<120ms query responses",
"95%+ recall on incomplete queries",
"120 records/min ingestion",
],
technicalSignal:
"The project combines production infrastructure, fuzzy retrieval, computer vision matching, and resilient ingestion under life-critical data-quality constraints.",
},

faultmap: {
mission:
"Diagnose where LLMs fail by converting prompt sets into semantic clusters, statistically tested failure slices, and coverage-gap reports.",
architecture: [
"Python library using HuggingFace embeddings, PyTorch, HDBSCAN, Scikit-Learn, NumPy, asyncio, Docker, Pytest, and GitHub Actions.",
"Semantic pipeline embeds prompts, clusters related inputs, and runs per-cluster hypothesis tests for elevated error rates.",
"Async evaluation system coordinates 50+ parallel LLM calls with semaphore rate limiting, exponential backoff, and CI/CD packaging.",
],
coreOperations: [
"Implemented McNemar, Fisher exact, chi-squared routing, and Benjamini-Hochberg FDR correction for valid slice detection.",
"Built semantic entropy and multi-sample self-consistency scoring to flag hallucination-prone regions without ground-truth labels.",
"Published a pip-installable diagnostic library with coverage auditing between evaluation prompts and production traffic.",
],
metrics: [
"50+ parallel LLM calls",
"PyPI-published package",
"Apache 2.0 open-source release",
"CI/CD via GitHub Actions",
],
technicalSignal:
"Faultmap turns qualitative LLM failures into statistically defensible diagnostics by combining embedding geometry, hypothesis testing, and production-grade async execution.",
},

crashes: {
mission:
"Model traffic crash recidivism from large-scale Chicago records to identify recurring risk patterns across drivers, vehicles, time, and geography.",
architecture: [
"ML pipeline built with Python, PostgreSQL, XGBoost, LightGBM, Scikit-Learn, GeoPandas, and SHAP.",
"Normalized 4NF PostgreSQL schema with SQL feature marts, indexing, materialized views, and temporal validation discipline.",
"Multi-class classification stack comparing Logistic Regression, Random Forest, Gradient Boosting, XGBoost, and LightGBM.",
],
coreOperations: [
"Engineered 40+ predictive features spanning temporal patterns, driver behavior, vehicle characteristics, and geospatial risk.",
"Applied DBSCAN and K-means hotspot analysis to derive spatial risk scores from crash concentration patterns.",
"Handled 3% class imbalance using SMOTE, leakage-aware validation, SHAP analysis, and permutation feature importance.",
],
metrics: [
"8M+ traffic records",
"40+ engineered features",
"3% minority-class imbalance",
"0.75 ROC-AUC",
"46% recall for top 5% highest-risk zones",
],
technicalSignal:
"The system demonstrates end-to-end applied ML maturity, from normalized database design and geospatial feature engineering to imbalance-aware evaluation.",
},

options: {
mission:
"Track options-flow microstructure and forecast volatility impact through durable ingestion, feature engineering, and low-latency model serving.",
architecture: [
"Event-driven stack using Python, PySpark, LightGBM, Kafka, FastAPI, MongoDB, Parquet, React, and Docker.",
"Nine-container MongoDB sharded cluster with two replica-set shards, hashed option-symbol sharding, and RBAC.",
"Offline/online MLOps design with Parquet feature store, point-in-time joins, and FastAPI model inference service.",
],
coreOperations: [
"Built parallel WebSocket ingestion and 60-second REST snapshot polling for live options microstructure data.",
"Implemented PySpark clean, enrich, and transform stages for Vol/OI, IV Skew, Net Gamma Exposure, Put/Call ratio, and moneyness spreads.",
"Deployed LightGBM volatility forecasting while enforcing temporal correctness to prevent look-ahead bias.",
],
metrics: [
"9-container sharded cluster",
"2 replica-set shards",
"60-second REST snapshot poller",
"10 live tickers",
"<50ms inference latency",
],
technicalSignal:
"The project signals strong systems range by joining market-data ingestion, distributed storage, Spark analytics, and bias-controlled forecasting.",
},

wordle: {
mission:
"Build a latency-bound Wordle solver that maximizes information gain, prunes combinatorial states, and converges under tournament constraints.",
architecture: [
"Python engine using NumPy vectorization, multiprocessing, Shannon entropy scoring, and serialized decision tables.",
"Search strategy evaluates full combinatorial feedback space and dynamically scores candidate guesses by expected partition quality.",
"Precomputed optimal decision trees for turns one through three with zero I/O during tournament execution.",
],
coreOperations: [
"Implemented entropy maximization and probability-weighted pruning to select guesses under strict runtime limits.",
"Accelerated feedback simulation through vectorized pattern computation and multiprocessing state-space exploration.",
"Engineered cluster-busting probes for high-collision word pools where normal dictionary guesses failed to separate candidates.",
],
metrics: [
"1st Place Tournament Winner",
">99% solve rate",
"~3.7 average guesses",
"1 CPU / 5-second constraint",
"~640x search acceleration",
],
technicalSignal:
"The solver compresses a combinatorial search problem into a real-time decision engine through entropy theory, vectorization, and precomputed inference.",
},

pipeline: {
mission:
"Maintain autonomous e-commerce price extraction under adversarial anti-bot conditions using resilient scraping, fallbacks, and scheduled execution.",
architecture: [
"Containerized Python data acquisition pipeline deployed on a Google Cloud Platform VPS with SQLite persistence.",
"Multi-tier ingestion path ordered through official REST APIs, residential proxy routes, and undocumented internal JSON endpoints.",
"Scheduler layer uses APScheduler, randomized execution jitter, and fallback control paths for continuous operation.",
],
coreOperations: [
"Implemented Chrome JA3/JA4 TLS fingerprint spoofing through curl_cffi to bypass Akamai Bot Manager defenses.",
"Built 24/7 time-series price extraction with durable storage for historical trend analysis.",
"Integrated fallback routing and asynchronous alerting through Telegram Bot API and SMTP threshold notifications.",
],
metrics: [
"24/7 autonomous extraction",
"GCP VPS deployment",
"Three-tier ingestion fallback strategy",
"Persistent SQLite historical store",
],
technicalSignal:
"The pipeline is technically notable for treating scraping as a reliability problem across fingerprints, network routes, schedulers, and data persistence.",
},

insulink: {
mission:
"Coordinate diabetes care by connecting patients and doctors through appointments, monitored records, secure communication, and structured care workflows.",
architecture: [
"Full-stack web application built around patient-doctor linkage, authentication, appointment scheduling, and medical-history access.",
"Implemented with C#, SQL, HTML, and ASP.NET Core as a care-coordination MVP.",
"Designed for subsidized virtual and in-person consultations between patients and under-utilized private doctors.",
],
coreOperations: [
"Led a four-person team through end-to-end design and development of the diabetes-care web platform.",
"Engineered core workflows for user authentication, consultation booking, and secure medical-history management.",
"Structured the platform around healthcare access gaps caused by public-system overdemand and private-doctor underuse.",
],
metrics: [
"70+ users",
"4-person engineering team",
"MVP full-stack deployment",
"Patient-doctor care workflow",
],
technicalSignal:
"InsuLink shows applied software engineering in a regulated care context, translating medical coordination needs into authenticated, workflow-driven infrastructure.",
},

genetic: {
mission:
"Estimate historical atmospheric CO₂ trends by evolving candidate curve parameters until high-fidelity convergence emerges from stochastic search.",
architecture: [
"Genetic algorithm framework implemented with C#, .NET 6, deterministic seeding, and modular optimization components.",
"Evolutionary loop uses tournament selection, arithmetic crossover, adaptive Gaussian mutation, and fitness-based convergence tracking.",
"Benchmarking layer compares population sizes, mutation rates, success probability, and fitness evaluations under reproducible runs.",
],
coreOperations: [
"Implemented adaptive mutation to balance exploration and convergence during atmospheric CO₂ curve fitting.",
"Tracked population diversity, convergence behavior, and runtime through empirical fitness-evaluation analysis.",
"Fit historical CO₂ trajectories and analyzed how evolutionary dynamics affected precision and stability.",
],
metrics: [
"R² > 0.95",
"Deterministic seeding",
"Adaptive Gaussian mutation",
"Empirical runtime analysis",
],
technicalSignal:
"The project demonstrates algorithmic modeling discipline by exposing convergence mechanics rather than treating the genetic algorithm as a black box.",
},

pharmacy: {
mission:
"Optimize pharmacy network expansion by ranking candidate sites against healthcare access, demand signals, and commercial viability constraints.",
architecture: [
"Facility-location optimization project using Python, R, INEGI/DENUE data, and geospatial visualization workflows.",
"Formulated expansion as a p-median problem with a weighted greedy heuristic across 200 candidate sites.",
"Multi-criteria scoring integrates demographics, disease prevalence, economic indicators, accessibility, and sensitivity analysis.",
],
coreOperations: [
"Designed a site-ranking model balancing coverage expansion with expected financial payback.",
"Integrated 7+ external variables into a quantitative decision framework for pharmacy placement.",
"Generated geospatial visualizations and site-type recommendations grounded in optimization outputs.",
],
metrics: [
"200 candidate sites scored",
"12% coverage improvement",
"Sub-16-month payback",
"7+ decision variables",
"INEGI/DENUE data integration",
],
technicalSignal:
"The optimizer connects operations research, public-health access, geospatial data, and business constraints into a measurable expansion strategy.",
},
} as const;
