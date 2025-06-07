# ADR-006: Enhanced User Profile System

## Status

- [x] Proposed
- [ ] Accepted
- [ ] Rejected
- [ ] Superseded by ADR-YYYY
- [ ] Deprecated

**Date:** 2025-06-07  
**Authors:** Development Team  
**Reviewers:** Technical Lead  
**Related ADRs:** ADR-001 (User Authentication System), ADR-004 (Shared Transactions Feature)

---

## Context and Problem Statement

### Background

O sistema de gestão de despesas atualmente utiliza o sistema de autenticação do Supabase Auth, mas possui limitações na gestão de informações de perfil do usuário. Existe uma tabela `profiles` básica, porém ela não oferece funcionalidades robustas para:

- Gerenciamento completo de dados pessoais
- Upload e gestão de avatares de usuário
- Busca de usuários para funcionalidades de compartilhamento
- Preferências e configurações personalizadas
- Onboarding e experiência do usuário aprimorada

### Problem Description

Os usuários precisam de um sistema completo de perfil que permita:

**Problemas Atuais:**

- Dados de perfil limitados e fragmentados
- Ausência de sistema de avatar/foto do usuário
- Dificuldade para encontrar outros usuários no sistema
- Falta de configurações personalizadas
- Experiência de onboarding básica
- Carregamento manual dos dados de perfil

**Necessidades Identificadas:**

- Sistema completo de gestão de perfil do usuário
- Upload e gerenciamento de avatares
- Busca eficiente de usuários para compartilhamento
- Carregamento automático de dados de perfil com autenticação
- Preferências e configurações granulares
- Interface moderna e responsiva para edição de perfil

### Technical Context

- **Tech Stack:** Next.js 15+, React 19+, TypeScript, Supabase, Tailwind CSS
- **Storage:** Supabase Storage para avatares e arquivos
- **Authentication:** Supabase Auth como base
- **Database:** PostgreSQL com RLS (Row Level Security)
- **Real-time:** Supabase Realtime para updates

---

## Decision Drivers

### Functional Requirements

- [ ] **FR-1:** Gestão completa de informações pessoais (nome, bio, contato, localização)
- [ ] **FR-2:** Sistema de upload e gerenciamento de avatares
- [ ] **FR-3:** Busca de usuários por nome ou email para compartilhamento
- [ ] **FR-4:** Carregamento automático de dados de perfil com autenticação
- [ ] **FR-5:** Configurações e preferências personalizadas
- [ ] **FR-6:** Sistema de onboarding para novos usuários
- [ ] **FR-7:** Interface responsiva e acessível para edição de perfil
- [ ] **FR-8:** Integração com sistema de transações compartilhadas
- [ ] **FR-9:** Controle de privacidade e visibilidade do perfil

### Non-Functional Requirements

- [ ] **NFR-1:** Performance - Carregamento de perfil < 1s
- [ ] **NFR-2:** Security - RLS policies para proteção de dados
- [ ] **NFR-3:** Storage - Otimização de imagens e controle de tamanho
- [ ] **NFR-4:** Accessibility - WCAG 2.1 AA compliance
- [ ] **NFR-5:** Mobile-first - Interface otimizada para dispositivos móveis
- [ ] **NFR-6:** SEO-friendly - Estrutura adequada para indexação

### Technical Constraints

- [ ] Manter compatibilidade com Supabase Auth existente
- [ ] Trabalhar com sistema de RLS atual
- [ ] Integrar com funcionalidades de transações compartilhadas
- [ ] Suportar upload de imagens otimizado
- [ ] Manter performance do sistema existente

---

## Considered Options

### Option 1: Enhanced Profiles Table with Storage Integration (Recommended)

**Description:** Aprimorar a tabela `profiles` existente com campos adicionais e integrar com Supabase Storage para avatares, criando um sistema completo de gestão de perfil.

**Pros:**

- ✅ Aproveita estrutura existente
- ✅ Integração nativa com Supabase Storage
- ✅ RLS policies robustas
- ✅ Carregamento automático com autenticação
- ✅ Escalável e performático
- ✅ Sistema de busca eficiente

**Cons:**

- ❌ Requer migração da tabela existente
- ❌ Complexidade adicional de storage
- ❌ Gerenciamento de uploads

**Implementation Effort:** Medium
**Risk Level:** Low

### Option 2: Separate User Details Table

**Description:** Criar uma nova tabela separada para detalhes do usuário, mantendo `profiles` apenas para dados básicos.

**Pros:**

- ✅ Separação clara de responsabilidades
- ✅ Não afeta estrutura existente
- ✅ Flexibilidade para diferentes tipos de dados

**Cons:**

- ❌ Complexidade adicional de relacionamentos
- ❌ Queries mais complexas
- ❌ Possível inconsistência de dados
- ❌ Performance inferior

**Implementation Effort:** High
**Risk Level:** Medium

### Option 3: External Profile Service

**Description:** Utilizar serviço externo (como Auth0, Firebase) para gestão de perfis.

**Pros:**

- ✅ Funcionalidades prontas
- ✅ Menor desenvolvimento
- ✅ Suporte especializado

**Cons:**

- ❌ Dependência externa
- ❌ Custos adicionais
- ❌ Menor controle
- ❌ Integração complexa com Supabase
- ❌ Possível vendor lock-in

**Implementation Effort:** Medium
**Risk Level:** High

---

## Decision Outcome

### Chosen Option

**Selected:** Option 1 - Enhanced Profiles Table with Storage Integration

### Rationale

- Melhor integração com a arquitetura existente
- Aproveitamento máximo das funcionalidades do Supabase
- Performance otimizada com carregamento automático
- Controle total sobre dados e privacidade
- Escalabilidade para futuras funcionalidades
- Melhor custo-benefício

### Trade-offs Accepted

- Complexidade adicional no gerenciamento de storage
- Necessidade de migração de dados existentes
- Responsabilidade sobre otimização de imagens
- Gerenciamento manual de uploads e validações

---

## Implementation Details

### Enhanced Database Schema

```sql
-- Enhance existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'pt-BR';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'BRL';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_email BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_push BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_shared_transactions BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(10) DEFAULT 'system';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_profile VARCHAR(10) DEFAULT 'public';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- RLS policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Enhanced RLS policies for profiles
CREATE POLICY "Users can view public profiles or their own" ON profiles
  FOR SELECT USING (
    privacy_profile = 'public' 
    OR id = auth.uid()
    OR (privacy_profile = 'friends' AND id IN (
      SELECT shared_with_user_id FROM transaction_shares 
      WHERE shared_with_user_id = auth.uid()
      OR transaction_id IN (
        SELECT id FROM transactions WHERE user_id = auth.uid()
      )
    ))
  );

-- Function to create profile automatically
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (
    id, 
    email, 
    full_name,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
CREATE TRIGGER create_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();
```

### Architecture Components

```typescript
// Core Types
interface EnhancedProfile extends Profile {
  avatar_url?: string | null;
  preferences: UserPreferences;
  stats: ProfileStats;
}

interface UserPreferences {
  timezone: string;
  language: string;
  currency: string;
  date_format: string;
  notification_email: boolean;
  notification_push: boolean;
  notification_shared_transactions: boolean;
  theme_preference: 'light' | 'dark' | 'system';
  privacy_profile: 'public' | 'private' | 'friends';
}

interface ProfileStats {
  totalTransactions: number;
  totalExpenses: number;
  totalIncome: number;
  totalSharedTransactions: number;
  acceptedShares: number;
  joinedDate: string | null;
}

// Service Layer
class ProfileService {
  static async getCurrentProfile(): Promise<ProfileWithAvatar | null>
  static async updateProfile(userId: string, updates: ProfileUpdate): Promise<ProfileWithAvatar | null>
  static async uploadAvatar(userId: string, file: File): Promise<AvatarUploadResult>
  static async searchUsers(query: string, limit?: number): Promise<UserSearchResult[]>
  static async getProfileStats(userId: string): Promise<ProfileStats | null>
  static async completeOnboarding(userId: string): Promise<void>
}

// Custom Hooks
const useProfile = (): UseProfileReturn
const useAuthWithProfile = (): { user, profile, loading }
```

### File Structure

```
lib/
├── profile/
│   └── service.ts (Enhanced profile management)
├── supabase/
│   └── client.ts (Enhanced with profile loading)
hooks/
├── use-profile.ts (Profile state management)
components/
├── profile/
│   ├── user-avatar.tsx (Avatar display component)
│   ├── avatar-upload.tsx (Avatar upload with validation)
│   └── profile-form.tsx (Profile editing form)
├── forms/
│   └── user-selector.tsx (User search for sharing)
app/
├── profile/
│   └── page.tsx (Profile management page)
├── onboarding/
│   └── page.tsx (New user onboarding)
types/
├── database.ts (Enhanced with profile types)
migrations/
└── 20250607_140000_enhance_profiles_table.sql
```

---

## Key Features Implementation

### 1. Automatic Profile Loading

**Integration with Authentication:**

- Carregamento automático de dados de perfil ao autenticar
- Hook `useAuthWithProfile()` para contexto global
- Cache inteligente para otimização de performance
- Sincronização em tempo real com mudanças

### 2. Avatar Management System

**Features:**

- Upload com validação (tamanho, tipo, dimensões)
- Compressão automática de imagens
- Fallback com iniciais do usuário
- Múltiplos tamanhos responsivos
- Gerenciamento de storage otimizado

### 3. User Search and Discovery

**Functionality:**

- Busca por nome ou email
- Filtros de privacidade respeitados
- Resultados paginados e otimizados
- Cache de resultados frequentes
- Integração com compartilhamento de transações

### 4. Comprehensive Profile Management

**Profile Fields:**

- Informações básicas (nome, bio, contato)
- Preferências do sistema (timezone, idioma, moeda)
- Configurações de notificação
- Controles de privacidade
- Status de onboarding

### 5. Privacy and Security

**Controls:**

- Configurações granulares de privacidade
- RLS policies multicamadas
- Controle de visibilidade por funcionalidade
- Auditoria de acesso aos dados
- Conformidade com LGPD/GDPR

---

## Testing Strategy

### Unit Tests

- [ ] ProfileService methods and error handling
- [ ] Avatar upload validation and processing
- [ ] User search functionality and filters
- [ ] Profile form validation and submission
- [ ] Privacy controls and visibility logic

### Integration Tests

- [ ] End-to-end profile creation and editing workflow
- [ ] Avatar upload to Supabase Storage
- [ ] User search integration with sharing features
- [ ] Authentication integration with profile loading
- [ ] RLS policy enforcement across all scenarios

### Performance Tests

- [ ] Profile loading time optimization
- [ ] Avatar upload and processing performance
- [ ] User search response times
- [ ] Database query optimization validation
- [ ] Storage bandwidth usage monitoring

### Security Tests

- [ ] RLS policy validation for all profile operations
- [ ] Avatar upload security and validation
- [ ] User search permission enforcement
- [ ] Privacy settings compliance testing
- [ ] Data exposure prevention validation

---

## Security Considerations

### Data Protection

- [ ] **Input Validation:** Comprehensive validation for all profile fields
- [ ] **File Upload Security:** Avatar validation, scanning, and sanitization
- [ ] **Data Minimization:** Only necessary data exposure in search results
- [ ] **Privacy Controls:** Granular control over profile visibility

### Storage Security

- [ ] **Access Control:** RLS policies for avatar storage
- [ ] **File Validation:** Type, size, and content validation
- [ ] **Malware Protection:** File scanning and quarantine
- [ ] **Bandwidth Control:** Upload limits and rate limiting

### Privacy Compliance

- [ ] **LGPD/GDPR Compliance:** Data portability and deletion rights
- [ ] **Consent Management:** Clear consent for data usage
- [ ] **Data Retention:** Automated cleanup policies
- [ ] **Audit Trail:** Comprehensive logging of data access

---

## Performance Optimization

### Database Optimization

- [ ] **Efficient Indexing:** Strategic indexes for profile queries
- [ ] **Query Optimization:** Minimize N+1 queries with proper joins
- [ ] **Caching Strategy:** Profile data caching with invalidation
- [ ] **Connection Pooling:** Optimized database connections

### Storage Optimization

- [ ] **Image Compression:** Automatic optimization for avatars
- [ ] **CDN Integration:** Fast global content delivery
- [ ] **Lazy Loading:** Load images only when needed
- [ ] **Progressive Enhancement:** Graceful degradation for slow connections

### Frontend Optimization

- [ ] **Code Splitting:** Separate bundles for profile features
- [ ] **State Management:** Efficient state updates and caching
- [ ] **Optimistic Updates:** Immediate UI feedback
- [ ] **Error Boundaries:** Graceful error handling

---

## Migration Strategy

### Phase 1: Database Enhancement (Week 1)

- [ ] Execute schema migration for profiles table
- [ ] Create storage bucket and policies
- [ ] Implement enhanced RLS policies
- [ ] Test with existing data

### Phase 2: Core Services (Week 2)

- [ ] Implement ProfileService with all methods
- [ ] Create avatar upload and management system
- [ ] Develop user search functionality
- [ ] Add comprehensive error handling

### Phase 3: UI Components (Week 3)

- [ ] Build profile management interface
- [ ] Create avatar upload component
- [ ] Implement user search component
- [ ] Design responsive profile forms

### Phase 4: Integration (Week 4)

- [ ] Integrate with authentication system
- [ ] Connect with shared transactions feature
- [ ] Implement real-time updates
- [ ] Add notification preferences

### Phase 5: Advanced Features (Week 5)

- [ ] Create onboarding flow
- [ ] Add profile analytics and insights
- [ ] Implement advanced privacy controls
- [ ] Optimize performance and caching

---

## Success Metrics

### Technical Metrics

- [ ] **Performance:** Profile loading < 1s, avatar upload < 5s
- [ ] **Reliability:** 99.9% profile operation success rate
- [ ] **Security:** Zero critical profile-related vulnerabilities
- [ ] **Storage:** < 50MB average storage per user

### Business Metrics

- [ ] **Profile Completion:** 80% of users complete profile within 7 days
- [ ] **Avatar Upload:** 60% of users upload avatar within 30 days
- [ ] **User Discovery:** 40% of users use search for sharing within 30 days
- [ ] **Engagement:** Users with complete profiles have 25% higher retention

### User Experience Metrics

- [ ] **Completion Rate:** 90% of profile editing sessions completed
- [ ] **Error Rate:** < 3% error rate in profile operations
- [ ] **User Satisfaction:** Profile management satisfaction > 4.5/5
- [ ] **Mobile Usage:** 70% of profile operations completed on mobile

---

## Future Enhancements

### Advanced Profile Features

- [ ] **Social Features:** Follow/friend system for users
- [ ] **Profile Verification:** Email, phone, and identity verification
- [ ] **Rich Profiles:** Custom themes, backgrounds, badges
- [ ] **Integration APIs:** Connect with external social platforms

### AI-Powered Features

- [ ] **Smart Suggestions:** AI-powered profile completion suggestions
- [ ] **Duplicate Detection:** Intelligent duplicate user detection
- [ ] **Content Moderation:** Automated profile content moderation
- [ ] **Personalization:** AI-driven user experience customization

### Enterprise Features

- [ ] **Team Profiles:** Organization and team management
- [ ] **Role Management:** Advanced permission systems
- [ ] **Bulk Operations:** Administrative bulk user management
- [ ] **Analytics Dashboard:** Comprehensive user analytics

---

## Risks and Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Storage costs escalation | Medium | Medium | Implement compression, cleanup policies |
| Avatar upload performance issues | Medium | Medium | Optimize compression, CDN integration |
| Profile data corruption | Low | High | Robust validation, backup strategies |
| Search performance degradation | Medium | Medium | Proper indexing, caching strategies |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low profile completion rates | Medium | Medium | Improved UX, incentives, onboarding |
| Privacy concerns | Low | High | Clear policies, granular controls |
| Storage abuse | Medium | Medium | Rate limiting, monitoring, quotas |
| Feature complexity overwhelming users | Medium | Medium | Progressive disclosure, excellent UX |

---

## References

### External Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [LGPD Compliance Guide](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Internal Resources

- ADR-001: User Authentication System
- ADR-004: Shared Transactions Feature
- Database Schema: `types/database.ts`
- Profile Service: `lib/profile/service.ts`

---

## Changelog

| Date | Author | Changes |
|------|--------|---------|
| 2025-06-07 | Development Team | Initial comprehensive ADR creation with enhanced profile system |

---

## AI Assistant Context

### Key Information for Future AI Assistance

**Feature Summary:** Comprehensive user profile management system with avatar support, user search, privacy controls, and automatic loading with authentication.

**Key Files Created/Modified:**

- `docs/adr-006-enhanced-user-profile-system.md` - This ADR document
- `lib/profile/service.ts` - Core profile management service
- `hooks/use-profile.ts` - Profile state management hook
- `components/profile/user-avatar.tsx` - Reusable avatar component
- `components/profile/avatar-upload.tsx` - Avatar upload with validation
- `app/profile/page.tsx` - Profile management interface
- `types/database.ts` - Enhanced TypeScript types
- Database migration for enhanced profiles table

**Integration Points:**

- **Authentication:** Automatic profile loading with Supabase Auth
- **Storage:** Supabase Storage for avatar management
- **Sharing:** User search integration for transaction sharing
- **Privacy:** Granular RLS policies for data protection

**Common Issues & Solutions:**

- **Issue 1:** Avatar upload performance → **Solution:** Image compression and optimization
- **Issue 2:** User search scalability → **Solution:** Efficient indexing and caching
- **Issue 3:** Privacy compliance → **Solution:** Granular controls and audit trails
- **Issue 4:** Profile loading performance → **Solution:** Automatic loading and caching

**Future Enhancement Opportunities:**

- Social features with follow/friend systems
- AI-powered profile suggestions and content moderation
- Advanced analytics and user insights
- Integration with external identity providers
- Team and organization management features
