import { Link, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { StateView } from '@/components/ui/StateView';
import { TextField } from '@/components/ui/TextField';
import { usePainelStore } from '@/stores/usePainelStore';
import { colors, spacing } from '@/theme/tokens';

export default function MyPropertiesScreen() {
  const { properties, isLoading, hydrate } = usePainelStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    if (!normalized) return properties;

    return properties.filter((property) =>
      [
        property.title,
        property.city,
        property.state,
        property.neighborhood,
        property.address_line,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(normalized),
    );
  }, [properties, query]);

  return (
    <Screen>
      <PageHeader
        eyebrow="Gestão de anúncios"
        title="Meus imóveis"
        description="Toque em um anúncio para editar dados, endereço, comodidades, fotos ou publicação."
      />

      <Link href="/painel/imoveis/novo" asChild>
        <Button label="Novo imóvel" />
      </Link>

      <TextField
        label="Buscar na carteira"
        placeholder="Título, bairro ou cidade"
        value={query}
        onChangeText={setQuery}
      />

      {isLoading && properties.length === 0 ? (
        <StateView title="Carregando imóveis..." loading />
      ) : filtered.length === 0 ? (
        <StateView
          title="Nenhum imóvel encontrado"
          description="Cadastre um novo imóvel ou altere o termo da busca."
        />
      ) : (
        <View style={styles.list}>
          <Text style={styles.count}>{filtered.length} imóvel(is)</Text>
          {filtered.map((property) => (
            <View key={property.id} style={styles.item}>
              <PropertyCard
                property={property}
                onPress={() =>
                  router.push({
                    pathname: '/painel/imoveis/[id]/editar',
                    params: { id: String(property.id) },
                  })
                }
              />
              <Text style={styles.hint}>Toque no card para gerenciar este anúncio.</Text>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.lg },
  item: { gap: spacing.xs },
  count: { color: colors.text, fontSize: 13, fontWeight: '700' },
  hint: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
});
