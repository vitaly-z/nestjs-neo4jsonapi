const query = (params: { term?: string }): string => {
  return `
        OPTIONAL MATCH (chunk)-[:HAS_ATOMIC_FACT]->(:AtomicFact)-[:HAS_KEY_CONCEPT]->(startingKC:KeyConcept)
        OPTIONAL MATCH (chunk)<-[:OCCURS_IN]-(startingKCR:KeyConceptRelationship)-[:BELONGS_TO]->(company)
        WITH company, collect(DISTINCT startingKC)  AS startingKCs, collect(DISTINCT startingKCR) AS startingKCRs

       CALL {
          WITH company, startingKCs
          WITH company, CASE WHEN startingKCs IS NULL OR size(startingKCs)=0 THEN [NULL] ELSE startingKCs END AS kcs, 1 AS keep
          UNWIND kcs AS startingKC
          OPTIONAL MATCH (startingKC)<-[:HAS_KEY_CONCEPT]-(:AtomicFact)<-[:HAS_ATOMIC_FACT]-(:Chunk)<-[:HAS_CHUNK]-(rc1)-[:BELONGS_TO]->(company)
          WITH keep, rc1
          WITH keep, rc1, count(*) AS kcScore
          WITH keep, collect({content: rc1, score: kcScore}) AS tmp
          RETURN [x IN tmp WHERE x.content IS NOT NULL] AS kcResults
        }

        CALL {
          WITH company, startingKCRs
          WITH company,CASE WHEN startingKCRs IS NULL OR size(startingKCRs)=0 THEN [NULL] ELSE startingKCRs END AS kcrs,1 AS keep
          UNWIND kcrs AS startingKCR
          OPTIONAL MATCH (startingKCR)-[:RELATES_TO]->(:KeyConcept)<-[:HAS_KEY_CONCEPT]-(:AtomicFact)<-[:HAS_ATOMIC_FACT]-(:Chunk)<-[:HAS_CHUNK]-(rc2)-[:BELONGS_TO]->(company)
          WITH keep, rc2, startingKCR
          WITH keep, rc2, sum(coalesce(startingKCR.weight, 0)) AS kcrScore
          WITH keep, collect({content: rc2, score: kcrScore}) AS tmp
          RETURN [x IN tmp WHERE x.content IS NOT NULL] AS kcrResults
        }

        WITH kcResults, kcrResults, startingKCs, startingKCRs
        WITH 1 AS keep, kcResults + kcrResults AS combinedResults, size(startingKCs) + size(startingKCRs) AS totalKCs
        UNWIND CASE WHEN size(combinedResults)=0 THEN [NULL] ELSE combinedResults END AS r
        WITH keep, r, totalKCs
        WHERE r IS NOT NULL
        WITH keep, r.content AS content, r.score AS score, totalKCs
        WITH keep, content, sum(score) AS totalCount, totalKCs
        WITH keep, content, CASE 
            WHEN totalKCs = 0 THEN 0
            WHEN (toFloat(totalCount) * 100.0 / totalKCs) > 100 THEN 100
            ELSE (toFloat(totalCount) * 100.0 / totalKCs)
          END AS totalScore

        ${params.term ? "WHERE toLower(content.name) CONTAINS toLower($term)" : ""}

        ORDER BY totalScore DESC
        {CURSOR}
    `;
};

const queryForAuthor = (params: { term?: string }): string => {
  return `
        OPTIONAL MATCH (chunk)-[:HAS_ATOMIC_FACT]->(:AtomicFact)-[:HAS_KEY_CONCEPT]->(startingKC:KeyConcept)
        OPTIONAL MATCH (chunk)<-[:OCCURS_IN]-(startingKCR:KeyConceptRelationship)-[:BELONGS_TO]->(company)
        WITH company, collect(DISTINCT startingKC)  AS startingKCs, collect(DISTINCT startingKCR) AS startingKCRs

        CALL {
          WITH company, startingKCs
          WITH company,
              CASE WHEN startingKCs IS NULL OR size(startingKCs)=0 THEN [NULL] ELSE startingKCs END AS kcs,
              1 AS keep  // anchor to preserve one row
          UNWIND kcs AS startingKC
          OPTIONAL MATCH (startingKC)<-[:HAS_KEY_CONCEPT]-(:AtomicFact)<-[:HAS_ATOMIC_FACT]-(:Chunk)<-[:HAS_CHUNK]-()-[:AUTHORED_BY|EDITED_BY]->(author1)-[:BELONGS_TO]->(company)
          WITH keep, author1
          WITH keep, author1, count(*) AS kcScore
          WITH keep, collect({content: author1, score: kcScore}) AS tmp
          RETURN [x IN tmp WHERE x.content IS NOT NULL] AS kcResults
        }

        CALL {
          WITH company, startingKCRs
          WITH company,
              CASE WHEN startingKCRs IS NULL OR size(startingKCRs)=0 THEN [NULL] ELSE startingKCRs END AS kcrs,
              1 AS keep
          UNWIND kcrs AS startingKCR
          OPTIONAL MATCH (startingKCR)-[:RELATES_TO]->(:KeyConcept)<-[:HAS_KEY_CONCEPT]-(:AtomicFact)<-[:HAS_ATOMIC_FACT]-(:Chunk)<-[:HAS_CHUNK]-()-[:AUTHORED_BY|EDITED_BY]->(author2)-[:BELONGS_TO]->(company)
          WITH keep, author2, startingKCR
          WITH keep, author2, sum(coalesce(startingKCR.weight, 0)) AS kcrScore
          WITH keep, collect({content: author2, score: kcrScore}) AS tmp
          RETURN [x IN tmp WHERE x.content IS NOT NULL] AS kcrResults
        }

        WITH kcResults, kcrResults, startingKCs, startingKCRs
        WITH 1 AS keep, kcResults + kcrResults AS combinedResults, size(startingKCs) + size(startingKCRs) AS totalKCs
        UNWIND CASE WHEN size(combinedResults)=0 THEN [NULL] ELSE combinedResults END AS r
        WITH keep, r, totalKCs
        WHERE r IS NOT NULL
        WITH keep, r.content AS author, r.score AS score, totalKCs
        WITH keep, author, sum(score) AS totalCount, totalKCs
        WITH keep, author, CASE 
          WHEN totalKCs = 0 THEN 0
          WHEN (toFloat(totalCount) * 100.0 / totalKCs) > 100 THEN 100
          ELSE (toFloat(totalCount) * 100.0 / totalKCs)
        END AS totalScore

        ${params.term ? "WHERE toLower(author.name) CONTAINS toLower($term)" : ""}

        ORDER BY totalScore DESC
        {CURSOR}
    `;
};

export const contentQuery = (params: { term?: string }): string => {
  return `
    MATCH (source {id: $id})-[:BELONGS_TO]->(company)
    MATCH (source)-[:HAS_CHUNK]->(chunk:Chunk)
    ${query({ term: params.term })}
`;
};

export const authorQuery = (params: { term?: string }): string => {
  return `
    MATCH (author {id: $id})-[:BELONGS_TO]->(company)
    OPTIONAL MATCH (author)<-[:AUTHORED_BY|EDITED_BY]->()-[:HAS_CHUNK]->(chunk:Chunk)
    ${query({ term: params.term })}
`;
};

export const contentToAuthorQuery = (params: { term?: string }): string => {
  return `
    MATCH (source {id: $id})-[:BELONGS_TO]->(company)
    MATCH (source)-[:HAS_CHUNK]->(chunk:Chunk)
    ${queryForAuthor({ term: params.term })}
`;
};

export const authorToAuthorQuery = (params: { term?: string }): string => {
  return `
    MATCH (author {id: $id})-[:BELONGS_TO]->(company)
    OPTIONAL MATCH (author)<-[:AUTHORED_BY|EDITED_BY]->()-[:HAS_CHUNK]->(chunk:Chunk)
    ${queryForAuthor({ term: params.term })}
`;
};
