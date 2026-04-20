package com.cars24.crmapi.repository;

import com.cars24.crmapi.CrmApiApplication;
import com.cars24.crmcore.dto.OrgHierarchyDto;
import com.cars24.crmcore.entity.TeamEntity;
import com.cars24.crmcore.entity.UserEntity;
import com.cars24.crmcore.repository.postgres.TeamRepository;
import com.cars24.crmcore.repository.postgres.UserRepository;
import com.cars24.crmcore.service.internal.OrgQueryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = CrmApiApplication.class)
@ActiveProfiles("test")
class OrgQueryServiceIntegrationTest {

    @Autowired
    private OrgQueryService orgQueryService;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        teamRepository.deleteAll();

        // Create TL user (let JPA generate the ID)
        UserEntity tl = new UserEntity();
        tl.setName("Team Lead 1");
        tl.setEmail("tl@test.com");
        tl.setRole("TL");
        tl.setRegion("West");
        tl.setCity("Mumbai");
        tl.setActive(true);
        tl.setCreatedAt(Instant.now());
        tl.setUpdatedAt(Instant.now());
        tl = userRepository.save(tl);
        UUID tlUserId = tl.getUserId();

        // Create team referencing the TL
        TeamEntity team = new TeamEntity();
        team.setTeamName("Mumbai West");
        team.setRegion("West");
        team.setCity("Mumbai");
        team.setTlUserId(tlUserId);
        team.setCreatedAt(Instant.now());
        team.setUpdatedAt(Instant.now());
        team = teamRepository.save(team);
        UUID teamId = team.getTeamId();

        // Update TL with team
        tl.setTeamId(teamId);
        userRepository.save(tl);

        // Create KAM
        UserEntity kam = new UserEntity();
        kam.setName("KAM One");
        kam.setEmail("kam1@test.com");
        kam.setRole("KAM");
        kam.setTeamId(teamId);
        kam.setRegion("West");
        kam.setCity("Mumbai");
        kam.setActive(true);
        kam.setCreatedAt(Instant.now());
        kam.setUpdatedAt(Instant.now());
        userRepository.save(kam);
    }

    @Test
    void getOrgHierarchy_returnsCorrectStructure() {
        OrgHierarchyDto result = (OrgHierarchyDto) orgQueryService.getOrgHierarchy();

        assertNotNull(result);
        assertFalse(result.getRegions().isEmpty());

        OrgHierarchyDto.RegionDto westRegion = result.getRegions().stream()
                .filter(r -> "West".equals(r.getRegion()))
                .findFirst()
                .orElseThrow();

        assertEquals(1, westRegion.getTeams().size());
        OrgHierarchyDto.TeamDto team = westRegion.getTeams().get(0);
        assertEquals("Mumbai West", team.getTeamName());
        assertEquals("Team Lead 1", team.getTlName());
        assertEquals(2, team.getKams().size()); // TL + KAM both belong to the team
    }
}
