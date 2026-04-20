package com.cars24.crmcore.repository.postgres;

import com.cars24.crmcore.entity.UntaggedDealerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UntaggedDealerRepository extends JpaRepository<UntaggedDealerEntity, String> {

    Optional<UntaggedDealerEntity> findByPhone(String phone);

    List<UntaggedDealerEntity> findByCreatedBy(UUID createdBy);
}
