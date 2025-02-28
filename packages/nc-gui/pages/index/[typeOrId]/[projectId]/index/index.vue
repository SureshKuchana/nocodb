<script setup lang="ts">
import { TabMetaInj, provide, storeToRefs, useSidebar, useTabs } from '#imports'

const tabStore = useTabs()
const { activeTab } = storeToRefs(tabStore)

useProjectsShortcuts()

provide(TabMetaInj, activeTab)

useSidebar('nc-left-sidebar')

const router = useRouter()

const route = router.currentRoute
</script>

<template>
  <div class="h-full w-full nc-container">
    <div class="h-full w-full flex flex-col">
      <!-- <div class="flex items-end !min-h-[var(--sidebar-top-height)] !bg-white-500 nc-tab-bar">
        <div
          v-if="!isOpen"
          class="nc-sidebar-left-toggle-icon hover:after:(bg-primary bg-opacity-75) group nc-sidebar-add-row py-2 px-3 mb-1"
        >
          <GeneralIcon
            v-e="['c:grid:toggle-navdraw']"
            icon="sidebarMinimise"
            class="cursor-pointer transform transition-transform duration-500 text-gray-500/80 hover:text-gray-500"
            :class="{ 'rotate-180': !isOpen }"
            @click="toggle(!isOpen)"
          />
        </div>

        <a-tabs v-model:activeKey="activeTabIndex" class="nc-root-tabs min-w-[500px]" type="editable-card" @edit="onEdit">
          <a-tab-pane v-for="(tab, i) of tabs" :key="i">
            <template #tab>
              <div class="flex items-center gap-2" data-testid="nc-tab-title">
                <div class="flex items-center">
                  <Icon
                    v-if="tab.meta?.icon"
                    :icon="tab.meta?.icon"
                    class="text-xl"
                    :data-testid="`nc-tab-icon-${tab.meta?.icon}`"
                  />
                  <component :is="icon(tab)" v-else class="text-sm" />
                </div>

                <div :data-testid="`nc-root-tabs-${tab.title}`">
                  <GeneralTruncateText :key="tab.title" :length="12">
                    {{ tab.title }}
                  </GeneralTruncateText>
                </div>
              </div>
            </template>
          </a-tab-pane>
        </a-tabs>

        <span class="flex-1" />

        <div class="flex justify-center self-center mr-2 min-w-[115px]">
          <div v-if="isLoading" class="flex items-center gap-2 ml-3 text-gray-200" data-testid="nc-loading">
            {{ $t('general.loading') }}

            <MdiLoading class="animate-infinite animate-spin" />
          </div>
        </div>

        <LazyGeneralShareBaseButton class="mb-1px" />
        <LazyGeneralFullScreen class="nc-fullscreen-icon mb-1px" />
      </div>
       -->
      <div class="w-full min-h-[300px] flex-auto">
        <NuxtPage />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.nc-container {
  height: 100vh;
  flex: 1 1 100%;
}

:deep(.nc-root-tabs) {
  & > .ant-tabs-nav {
    @apply !mb-0 before:(!border-b-0);

    .ant-tabs-extra-content {
      @apply !bg-white/0;
    }

    .ant-tabs-nav-add {
      @apply !hidden;
    }

    .ant-tabs-nav-more {
      @apply py-1.5;
    }

    & > .ant-tabs-nav-wrap > .ant-tabs-nav-list {
      & > .ant-tabs-tab {
        @apply border-0 !text-sm py-2 font-weight-medium  z-2;

        border-top-right-radius: 8px;
        border-top-left-radius: 8px;

        & + .ant-tabs-tab {
          @apply ml-1;
        }
      }

      & > .ant-tabs-tab-active {
        @apply relative bg-white w-full h-full overflow-y-visible;

        border-top: 1px solid white;
        border-left: 1px solid white;
        border-right: 1px solid white;
        @apply !border-[var(--navbar-border)];

        &:after {
          @apply absolute content-[''] left-0 -bottom-[1px] w-full h-[1px] bg-inherit z-100;
        }
      }

      & > .ant-tabs-tab:not(.ant-tabs-tab-active) {
        @apply bg-gray-50 text-gray-500;

        .ant-tabs-tab-remove {
          @apply !text-default;
        }
      }
    }
  }
}

:deep(.ant-menu-item-selected) {
  @apply text-inherit !bg-inherit;
}

:deep(.ant-menu-horizontal),
:deep(.ant-menu-item::after),
:deep(.ant-menu-submenu::after) {
  @apply !border-none;
}

.nc-tab-bar {
  @apply border-gray-150 !bg-gray-50 relative z-1;

  :deep(.ant-tabs-tab-remove) {
    @apply flex mt-[2px];
  }

  background: linear-gradient(0deg, var(--navbar-border) 1px, var(--navbar-bg) 1px) !important;

  :deep(.ant-tabs-tab:not(.ant-tabs-tab-active)) {
    background: linear-gradient(0deg, var(--navbar-border) 1px, #f2f2f2 1px) !important;
  }
}
</style>
