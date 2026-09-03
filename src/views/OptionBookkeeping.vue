<template>
  <div class="option-bookkeeping-page">
    <section class="option-bookkeeping-card" aria-label="期权簿记">
      <el-tabs v-model="activeTab" class="option-bookkeeping-tabs">
        <el-tab-pane label="待簿记" name="pending">
          <section class="option-bookkeeping-placeholder" aria-label="待簿记">
            <el-empty :image-size="72" description="暂无待簿记数据" />
          </section>
        </el-tab-pane>

        <el-tab-pane label="已簿记" name="booked">
          <section class="option-bookkeeping-placeholder" aria-label="已簿记">
            <el-empty :image-size="72" description="暂无已簿记数据" />
          </section>
        </el-tab-pane>

        <el-tab-pane label="簿记审批" name="reconciliation">
          <section class="option-bookkeeping-reconciliation" aria-label="数据核对异常">
            <section class="option-bookkeeping-summary" aria-label="异常数据统计">
              <div class="option-bookkeeping-summary__topline">
                <div>
                  <strong>异常概览</strong>
                  <span>仅展示需处理的数据核对记录</span>
                </div>
                <div class="option-bookkeeping-summary__refresh">
                  <span>最近加载：{{ dataLoadedAt }}</span>
                  <el-button
                    link
                    type="primary"
                    size="small"
                    :icon="RefreshLeft"
                    :loading="isDataRefreshing"
                    @click="refreshData()"
                    >刷新</el-button
                  >
                </div>
              </div>
              <div class="option-bookkeeping-summary__metrics">
                <article
                  :class="[
                    'option-bookkeeping-summary__total',
                    { 'is-active': !activeSummaryExceptionType },
                  ]"
                  role="button"
                  tabindex="0"
                  @click="showAllExceptionTypes"
                  @keydown.enter.prevent="showAllExceptionTypes"
                >
                  <span>异常总数</span>
                  <strong>{{ exceptionStats.total }}<em>条</em></strong>
                </article>
                <article
                  :class="[
                    'option-bookkeeping-summary__metric',
                    'option-bookkeeping-summary__metric--orange',
                    { 'is-active': activeSummaryExceptionType === 'faucon-missing' },
                  ]"
                  role="button"
                  tabindex="0"
                  @click="toggleSummaryExceptionType('faucon-missing')"
                  @keydown.enter.prevent="toggleSummaryExceptionType('faucon-missing')"
                >
                  <span class="option-bookkeeping-summary__icon">
                    <svg viewBox="0 0 1024 1024" aria-hidden="true">
                      <path
                        d="M448 699.904a256 256 0 0 1 260.096-251.84A254.336 254.336 0 0 1 960 704v4.096a256 256 0 0 1-260.096 251.84 255.616 255.616 0 0 1-251.84-260.032z m398.272 123.008c6.4-6.4 6.4-16.32 0-22.72L755.328 704l92.736-96.192c6.4-6.4 6.4-16.32 0-22.784l-22.208-22.72a16.192 16.192 0 0 0-22.144 0l-95.04 96.192-93.888-96.192a16.192 16.192 0 0 0-22.144 0l-22.144 22.72c-6.4 6.4-6.4 16.384 0 22.784l94.464 95.616-95.04 96.192c-6.4 6.4-6.4 16.32 0 22.72l23.872 23.936c6.4 5.824 16.32 5.824 22.144 0l92.16-96.192 93.888 95.616c6.4 5.76 16.32 5.76 22.144 0l22.144-22.784z"
                      />
                      <path
                        d="M192 64a64 64 0 0 0-64 64v729.6a64 64 0 0 0 64 64h277.376A320 320 0 0 1 812.8 402.944V128a64 64 0 0 0-64-64H192z m384 128v96H256V192h320zM256 384h192v96H256V384z"
                      />
                    </svg>
                  </span>
                  <div class="option-bookkeeping-summary__metric-copy">
                    <span>簿记作废</span>
                    <p>我方已作废，BCT 撤销</p>
                  </div>
                  <strong>{{ exceptionStats.fauconMissing }}<em>条</em></strong>
                </article>
                <article
                  :class="[
                    'option-bookkeeping-summary__metric',
                    'option-bookkeeping-summary__metric--blue',
                    { 'is-active': activeSummaryExceptionType === 'bct-missing' },
                  ]"
                  role="button"
                  tabindex="0"
                  @click="toggleSummaryExceptionType('bct-missing')"
                  @keydown.enter.prevent="toggleSummaryExceptionType('bct-missing')"
                >
                  <span class="option-bookkeeping-summary__icon">
                    <svg viewBox="0 0 1024 1024" aria-hidden="true">
                      <path
                        d="M595.2 840.32l-110.08-110.08c-49.92-49.92-49.92-131.2 0-181.12l128-128c49.92-49.92 131.2-49.92 181.12 0 25.6 25.6 37.76 60.16 37.12 93.44 40.96 4.48 78.72 17.92 112 37.76V160c0-79.36-64.64-144-144-144H160C80.64 16 16 80.64 16 160v704c0 79.36 64.64 144 144 144h361.6C515.84 993.28 512 977.28 512 960c0-55.04 34.56-101.12 83.2-119.68zM256 272h448c26.24 0 48 21.76 48 48s-21.76 48-48 48H256c-26.24 0-48-21.76-48-48s21.76-48 48-48z m128 352H256c-26.24 0-48-21.76-48-48s21.76-48 48-48h128c26.24 0 48 21.76 48 48s-21.76 48-48 48z"
                      />
                      <path
                        d="M800 592h-108.16l46.08-46.08c18.56-18.56 18.56-49.28 0-67.84s-49.28-18.56-67.84 0l-128 128c-18.56 18.56-18.56 49.28 0 67.84l128 128c9.6 9.6 21.76 14.08 33.92 14.08s24.32-4.48 33.92-14.08c18.56-18.56 18.56-49.28 0-67.84l-46.08-46.08h108.16c61.44 0 112 50.56 112 112s-50.56 112-112 112H640c-26.24 0-48 21.76-48 48s21.76 48 48 48h160c114.56 0 208-93.44 208-208s-93.44-208-208-208z"
                      />
                    </svg>
                  </span>
                  <div class="option-bookkeeping-summary__metric-copy">
                    <span>BCT 撤销</span>
                    <p>BCT撤销，我方未同步处理</p>
                  </div>
                  <strong>{{ exceptionStats.bctMissing }}<em>条</em></strong>
                </article>
                <article
                  :class="[
                    'option-bookkeeping-summary__metric',
                    'option-bookkeeping-summary__metric--red',
                    { 'is-active': activeSummaryExceptionType === 'field-mismatch' },
                  ]"
                  role="button"
                  tabindex="0"
                  @click="toggleSummaryExceptionType('field-mismatch')"
                  @keydown.enter.prevent="toggleSummaryExceptionType('field-mismatch')"
                >
                  <span class="option-bookkeeping-summary__icon">
                    <svg viewBox="0 0 1024 1024" aria-hidden="true">
                      <path
                        d="M292.6592 103.8336m47.5136 0l400.7936 0q47.5136 0 47.5136 47.5136l0 0q0 47.5136-47.5136 47.5136l-400.7936 0q-47.5136 0-47.5136-47.5136l0 0q0-47.5136 47.5136-47.5136Z"
                      />
                      <path
                        d="M545.792 616.2432a184.32 184.32 0 0 1 75.3664-75.9808c109.7728-58.9824 219.7504-33.792 288.5632 33.1776a1.8432 1.8432 0 0 0 3.2768-1.2288V188.6208a43.8272 43.8272 0 0 0-43.8272-43.8272H819.2a86.2208 86.2208 0 0 1-86.2208 86.2208H348.16a86.2208 86.2208 0 0 1-86.2208-86.2208h-49.7664a43.8272 43.8272 0 0 0-43.8272 43.8272v719.872a40.96 40.96 0 0 0 40.96 40.96H634.88a1.8432 1.8432 0 0 0 0-3.6864c-104.2432-56.7296-161.5872-192.7168-89.088-329.5232zM348.16 384.8192h382.976a31.9488 31.9488 0 1 1 0 63.6928H348.16a31.9488 31.9488 0 1 1 0-63.6928z m82.944 289.792h-81.92a31.9488 31.9488 0 1 1 0-63.6928h81.92a31.9488 31.9488 0 0 1 0 63.6928z"
                      />
                      <path
                        d="M746.2912 535.3472a203.3664 203.3664 0 1 0 203.3664 203.3664 203.3664 203.3664 0 0 0-203.3664-203.3664z m-26.4192 91.5456a26.4192 26.4192 0 0 1 52.6336 0v124.5184a26.4192 26.4192 0 1 1-52.6336 0z m26.4192 234.496a28.8768 28.8768 0 1 1 28.8768-28.672 28.8768 28.8768 0 0 1-28.8768 28.672z"
                      />
                    </svg>
                  </span>
                  <div class="option-bookkeeping-summary__metric-copy">
                    <span>数据不一致</span>
                    <p>双方均有数据，但数据存在差异</p>
                  </div>
                  <strong>{{ exceptionStats.fieldMismatch }}<em>条</em></strong>
                </article>
                <article
                  :class="[
                    'option-bookkeeping-summary__metric',
                    'option-bookkeeping-summary__metric--purple',
                    { 'is-active': activeSummaryExceptionType === 'historical-data-modified' },
                  ]"
                  role="button"
                  tabindex="0"
                  @click="toggleSummaryExceptionType('historical-data-modified')"
                  @keydown.enter.prevent="toggleSummaryExceptionType('historical-data-modified')"
                >
                  <span class="option-bookkeeping-summary__icon">
                    <svg viewBox="0 0 1024 1024" aria-hidden="true">
                      <path
                        d="M134.927059 797.033412a72.342588 72.342588 0 0 1 51.079529 123.361882c-13.552941 13.552941-31.924706 21.142588-51.139764 21.202824h-48.188236a72.342588 72.342588 0 0 1-51.2-123.361883 72.282353 72.282353 0 0 1 51.2-21.202823h48.188236z m554.164706-433.754353a289.189647 289.189647 0 1 1-0.120471 578.439529 289.189647 289.189647 0 0 1 0.120471-578.439529z m-457.848471 192.752941a72.282353 72.282353 0 0 1 0 144.564706h-144.564706a72.342588 72.342588 0 0 1 0-144.564706h144.564706z m457.788235-96.376471a48.188235 48.188235 0 0 0-48.188235 48.188236v144.564706a48.188235 48.188235 0 0 0 48.188235 48.188235h144.564706a48.188235 48.188235 0 0 0 0-96.376471h-96.37647v-96.37647a48.188235 48.188235 0 0 0-48.188236-48.188236z m-361.411764-144.564705a72.342588 72.342588 0 0 1 0 144.564705h-240.941177a72.342588 72.342588 0 0 1 0-144.564705h240.941177z m578.258823-240.941177a72.282353 72.282353 0 0 1 0 144.564706H86.738824a72.342588 72.342588 0 0 1 0-144.564706h819.2z"
                        fill="#151617"
                        fill-opacity=".85"
                      />
                    </svg>
                  </span>
                  <div class="option-bookkeeping-summary__metric-copy">
                    <span>历史数据修改</span>
                    <p>我方当前数据与历史数据不一致</p>
                  </div>
                  <strong>{{ exceptionStats.historicalDataModified }}<em>条</em></strong>
                </article>
              </div>
            </section>

            <form class="option-bookkeeping-filter" @submit.prevent="applyFilters">
              <label>
                <span>交易编号</span>
                <el-input v-model="draftFilters.transactionNo" clearable placeholder="请输入" />
              </label>
              <label>
                <span>背靠背合约</span>
                <el-input
                  v-model="draftFilters.backToBackContract"
                  clearable
                  placeholder="请输入"
                />
              </label>
              <label>
                <span>开平类型</span>
                <el-select v-model="draftFilters.category" clearable placeholder="请选择">
                  <el-option label="开仓" value="opening" />
                  <el-option label="平仓" value="closing" />
                </el-select>
              </label>
              <label>
                <span>交易日期</span>
                <el-date-picker
                  v-model="draftFilters.tradeDate"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="请选择"
                  clearable
                />
              </label>
              <div class="option-bookkeeping-filter__actions">
                <el-button type="primary" native-type="submit" :icon="Search">查询</el-button>
                <el-button :icon="RefreshLeft" @click="resetFilters">重置</el-button>
              </div>
            </form>

            <section class="option-bookkeeping-table-panel" aria-label="数据核对异常">
              <ExceptionTable
                :rows="pagedExceptions"
                :can-process="canProcessBookkeepingApproval"
                @process="openProcess"
                @void-bookkeeping="voidBookkeeping"
              />
              <div v-if="matchingExceptions.length" class="option-bookkeeping-pagination">
                <el-pagination
                  v-model:current-page="exceptionCurrentPage"
                  :page-size="exceptionPageSize"
                  :total="matchingExceptions.length"
                  layout="total, prev, pager, next"
                />
              </div>
            </section>
          </section>
        </el-tab-pane>

        <el-tab-pane label="历史变更" name="history">
          <section class="option-bookkeeping-history" aria-label="历史变更">
            <form
              class="option-bookkeeping-filter option-bookkeeping-history__filter"
              @submit.prevent="applyHistoryFilters"
            >
              <label>
                <span>交易编号</span>
                <el-input
                  v-model="historyDraftFilters.transactionNo"
                  clearable
                  placeholder="请输入"
                />
              </label>
              <label>
                <span>变更类型</span>
                <el-select v-model="historyDraftFilters.changeType" clearable placeholder="请选择">
                  <el-option label="更新" value="update" />
                  <el-option label="作废" value="void" />
                </el-select>
              </label>
              <label>
                <span>账户类型</span>
                <el-select v-model="historyDraftFilters.accountType" clearable placeholder="请选择">
                  <el-option
                    v-for="accountType in historyAccountTypes"
                    :key="accountType"
                    :label="accountType"
                    :value="accountType"
                  />
                </el-select>
              </label>
              <label>
                <span>最近变更时间</span>
                <el-date-picker
                  v-model="historyDraftFilters.modifiedAtRange"
                  type="daterange"
                  value-format="YYYY-MM-DD"
                  format="YYYY-MM-DD"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                />
              </label>
              <div class="option-bookkeeping-filter__actions">
                <el-button type="primary" native-type="submit" :icon="Search">查询</el-button>
                <el-button :icon="RefreshLeft" @click="resetHistoryFilters">重置</el-button>
              </div>
            </form>

            <section class="option-bookkeeping-table-panel" aria-label="历史变更记录">
              <el-table
                :data="pagedHistoryChangeGroups"
                row-key="id"
                class="option-bookkeeping-history-table"
                empty-text="暂无符合条件的历史变更记录"
                @scroll="syncSnapshotTablesScroll"
              >
                <el-table-column type="expand" width="44">
                  <template #default="{ row }">
                    <div class="option-bookkeeping-history-records">
                      <div class="option-bookkeeping-history-records__heading">
                        <strong>变更明细</strong>
                      </div>
                      <el-table
                        :ref="(element) => registerSnapshotTable(row.id, element)"
                        :data="row.records"
                        size="small"
                        class="option-bookkeeping-snapshot-table"
                      >
                        <el-table-column
                          prop="modifiedAt"
                          label="变更时间"
                          width="164"
                          show-overflow-tooltip
                        />
                        <el-table-column label="变更类型" width="72" align="center">
                          <template #default="{ row: snapshot }">
                            <el-tag
                              :type="snapshot.changeType === 'void' ? 'danger' : 'primary'"
                              effect="light"
                            >
                              {{ snapshot.changeType === 'void' ? '作废' : '更新' }}
                            </el-tag>
                          </template>
                        </el-table-column>
                        <el-table-column
                          prop="sourceChannel"
                          label="来源"
                          width="80"
                          show-overflow-tooltip
                        />
                        <el-table-column
                          prop="modifiedBy"
                          label="变更人"
                          width="80"
                          show-overflow-tooltip
                        />
                        <el-table-column
                          prop="approvedBy"
                          label="审批人"
                          width="80"
                          show-overflow-tooltip
                        />
                        <el-table-column
                          prop="coverReason"
                          label="原因"
                          width="120"
                          show-overflow-tooltip
                        />
                        <el-table-column
                          prop="approvedAt"
                          label="审批时间"
                          width="164"
                          show-overflow-tooltip
                        />
                        <el-table-column
                          v-for="snapshotField in snapshotColumns(row.records)"
                          :key="snapshotField.key"
                          :label="snapshotField.label"
                          :width="snapshotColumnWidth(snapshotField.key)"
                          show-overflow-tooltip
                        >
                          <template #default="{ row: snapshot }">
                            <el-tooltip
                              v-if="isSnapshotFieldManuallyTruncated(snapshot, snapshotField.key)"
                              :content="snapshotFieldValue(snapshot, snapshotField.key)"
                              placement="top"
                            >
                              <span
                                class="option-bookkeeping-snapshot-value"
                                :class="{
                                  'option-bookkeeping-snapshot-value--changed':
                                    isSnapshotFieldChanged(
                                      snapshot,
                                      row.records,
                                      snapshotField.key,
                                    ),
                                }"
                              >
                                {{ snapshotFieldDisplayValue(snapshot, snapshotField.key) }}
                              </span>
                            </el-tooltip>
                            <span
                              v-else
                              class="option-bookkeeping-snapshot-value"
                              :class="{
                                'option-bookkeeping-snapshot-value--changed':
                                  isSnapshotFieldChanged(snapshot, row.records, snapshotField.key),
                              }"
                            >
                              {{ snapshotFieldDisplayValue(snapshot, snapshotField.key) }}
                            </span>
                          </template>
                        </el-table-column>
                      </el-table>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column
                  prop="transactionNo"
                  label="交易编号"
                  min-width="220"
                  show-overflow-tooltip
                />
                <el-table-column
                  prop="backToBackContract"
                  label="背靠背合约编号"
                  min-width="190"
                  show-overflow-tooltip
                />
                <el-table-column
                  prop="accountType"
                  label="账户类型"
                  min-width="130"
                  show-overflow-tooltip
                />
                <el-table-column label="最近变更类型" min-width="130" align="center">
                  <template #default="{ row }">
                    <el-tag
                      :type="row.latestChangeType === 'void' ? 'danger' : 'primary'"
                      effect="light"
                    >
                      {{ row.latestChangeType === 'void' ? '作废' : '更新' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="recordCount" label="变更记录数" width="120" align="center" />
                <el-table-column
                  prop="latestSourceChannel"
                  label="最近变更渠道"
                  min-width="140"
                  show-overflow-tooltip
                />
                <el-table-column
                  prop="latestModifiedBy"
                  label="最近变更人"
                  min-width="120"
                  show-overflow-tooltip
                />
                <el-table-column
                  prop="latestModifiedAt"
                  label="最近变更时间"
                  min-width="180"
                  show-overflow-tooltip
                />
                <el-table-column
                  prop="latestApprovedBy"
                  label="最近审批人"
                  min-width="120"
                  show-overflow-tooltip
                />
                <el-table-column
                  prop="latestApprovedAt"
                  label="最近审批时间"
                  min-width="170"
                  show-overflow-tooltip
                />
              </el-table>
              <div v-if="historyChangeGroups.length" class="option-bookkeeping-pagination">
                <el-pagination
                  v-model:current-page="historyCurrentPage"
                  :page-size="historyPageSize"
                  :total="historyChangeGroups.length"
                  layout="total, prev, pager, next"
                />
              </div>
            </section>
          </section>
        </el-tab-pane>
      </el-tabs>
    </section>

    <el-dialog v-model="maintenanceDialogVisible" title="处理数据不一致" width="720px">
      <template v-if="maintenanceRecord">
        <div class="option-bookkeeping-maintenance-summary">
          <div>
            <span>交易编号：{{ maintenanceRecord.transactionNo }}</span>
            <span>异常类型：{{ exceptionTypeLabel(maintenanceRecord.exceptionType) }}</span>
          </div>
          <div class="option-bookkeeping-maintenance-summary__bulk">
            <span>对全部生效的最终值</span>
            <el-radio-group
              v-model="maintenanceBulkChoice"
              size="small"
              @change="applyMaintenanceChoice"
            >
              <el-radio-button label="faucon">猎盈值</el-radio-button>
              <el-radio-button label="bct">BCT 值</el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <el-table :data="maintenanceMatrixRows" class="option-bookkeeping-maintenance-table">
          <el-table-column prop="source" label="数据来源" width="112" />
          <el-table-column
            v-for="(difference, index) in maintenanceRecord.differences"
            :key="difference.field"
            :prop="`difference-${index}`"
            :label="difference.field"
            min-width="160"
            align="right"
          >
            <template #default="{ row }">
              <el-radio-group
                v-if="row.source === '最终值'"
                v-model="maintenanceChoices[difference.field]"
                size="small"
              >
                <el-radio label="faucon">猎盈值</el-radio>
                <el-radio label="bct">BCT 值</el-radio>
              </el-radio-group>
              <span v-else>{{ row[`difference-${index}`] }}</span>
            </template>
          </el-table-column>
        </el-table>
        <label class="option-bookkeeping-maintenance-reason">
          <span>覆盖原因 <em>*</em></span>
          <el-input
            v-model="maintenanceReason"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="请填写本次覆盖原因"
          />
        </label>
      </template>
      <template #footer>
        <div class="option-bookkeeping-maintenance-footer">
          <el-button @click="maintenanceDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmMaintenance">确认维护</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="historicalModificationDialogVisible" title="处理历史数据修改" width="760px">
      <template v-if="historicalModificationRecord && historicalModificationRows.length">
        <div class="option-bookkeeping-historical-summary">
          <span>交易编号：{{ historicalModificationRecord.transactionNo }}</span>
          <span>背靠背合约编号：{{ historicalModificationRecord.backToBackContract }}</span>
        </div>
        <el-table :data="historicalModificationRows" class="option-bookkeeping-maintenance-table">
          <el-table-column prop="modificationItem" label="修改项" min-width="140" />
          <el-table-column prop="source" label="数据来源" min-width="140" />
          <el-table-column prop="originalValue" label="原始值" min-width="110" />
          <el-table-column prop="modifiedValue" label="修改值" min-width="110" />
          <el-table-column prop="modifiedBy" label="修改人" min-width="110" />
          <el-table-column prop="modifiedAt" label="修改时间" min-width="170" />
        </el-table>
        <label class="option-bookkeeping-historical-choice">
          <span>处理意见 <em>*</em></span>
          <el-radio-group v-model="historicalModificationChoice">
            <el-radio label="approve">同意</el-radio>
            <el-radio label="reject">拒绝</el-radio>
          </el-radio-group>
        </label>
      </template>
      <template #footer>
        <div class="option-bookkeeping-maintenance-footer">
          <el-button @click="historicalModificationDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmHistoricalModification">确认处理</el-button>
        </div>
      </template>
    </el-dialog>

    <el-drawer
      v-model="bookkeepingDialogVisible"
      class="option-bookkeeping-drawer"
      size="980px"
      destroy-on-close
    >
      <template #header>
        <div class="option-bookkeeping-drawer__header">
          <div>
            <h2>簿记处理</h2>
          </div>
        </div>
      </template>

      <template v-if="bookkeepingRecord">
        <div class="option-bookkeeping-drawer__workspace">
          <div class="option-bookkeeping-drawer__overview">
            <span>背靠背合约：{{ bookkeepingRecord.backToBackContract }}</span>
            <span>交易对手：{{ bookkeepingRecord.counterparty }}</span>
            <span>资金账号：{{ bookkeepingRecord.account }}</span>
          </div>

          <el-tabs v-model="bookkeepingAccountTab" class="option-bookkeeping-drawer__accounts">
            <el-tab-pane
              v-for="accountTab in bookkeepingAccountTabs"
              :key="accountTab.name"
              :label="accountTab.label"
              :name="accountTab.name"
            />
          </el-tabs>

          <div class="option-bookkeeping-drawer__layout">
            <nav class="option-bookkeeping-anchor-menu" aria-label="簿记处理锚点菜单">
              <span class="option-bookkeeping-anchor-menu__title">目录</span>
              <button
                v-for="section in bookkeepingSections"
                :key="section.id"
                type="button"
                :class="[
                  'option-bookkeeping-anchor-menu__item',
                  { 'is-active': activeBookkeepingSection === section.id },
                ]"
                @click="scrollToBookkeepingSection(section.id)"
              >
                {{ section.title }}
              </button>
            </nav>

            <div class="option-bookkeeping-drawer__content">
              <section
                v-for="section in bookkeepingSections"
                :id="`bookkeeping-section-${section.id}`"
                :key="section.id"
                class="option-bookkeeping-form-section"
              >
                <div class="option-bookkeeping-form-section__heading">
                  <h3>{{ section.title }}</h3>
                </div>
                <div class="option-bookkeeping-form-grid">
                  <label
                    v-for="field in section.fields"
                    :key="field.key"
                    class="option-bookkeeping-form-field"
                  >
                    <span
                      >{{ field.label }} <em v-if="isBookkeepingFieldRequired(field)">*</em></span
                    >
                    <el-select
                      v-if="isBookkeepingFieldEditable(field) && isBookkeepingSelectField(field)"
                      v-model="activeBookkeepingForm[field.key]"
                      filterable
                      :placeholder="`请选择${field.label}`"
                    >
                      <el-option
                        v-for="option in bookkeepingFieldOptions(field)"
                        :key="option"
                        :label="option"
                        :value="option"
                      />
                    </el-select>
                    <el-date-picker
                      v-else-if="isBookkeepingFieldEditable(field) && isBookkeepingDateField(field)"
                      v-model="activeBookkeepingForm[field.key]"
                      type="date"
                      value-format="YYYY-MM-DD"
                      format="YYYY-MM-DD"
                      :placeholder="`请选择${field.label}`"
                    />
                    <el-input
                      v-else-if="isBookkeepingFieldEditable(field)"
                      v-model="activeBookkeepingForm[field.key]"
                      :placeholder="`请输入${field.label}`"
                    >
                      <template v-if="bookkeepingFieldSuffix(field)" #append>
                        {{ bookkeepingFieldSuffix(field) }}
                      </template>
                    </el-input>
                    <div v-else class="option-bookkeeping-form-field__value">
                      {{ activeBookkeepingForm[field.key] || '—' }}
                    </div>
                  </label>
                </div>
              </section>

              <section
                class="option-bookkeeping-form-section option-bookkeeping-form-section--reason"
              >
                <div class="option-bookkeeping-form-section__heading">
                  <h3>处理说明</h3>
                </div>
                <label class="option-bookkeeping-form-field option-bookkeeping-form-field--full">
                  <span>覆盖原因 <em>*</em></span>
                  <el-input
                    v-model="bookkeepingReason"
                    type="textarea"
                    :rows="3"
                    maxlength="200"
                    show-word-limit
                    placeholder="请填写本次覆盖原因"
                  />
                </label>
              </section>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="option-bookkeeping-drawer__footer">
          <el-button @click="bookkeepingDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveBookkeeping('all', false)">保存全部</el-button>
          <el-button type="primary" @click="saveBookkeeping('all', true)">保存全部并簿记</el-button>
          <el-button type="primary" @click="saveBookkeeping('current', false)">保存当前</el-button>
          <el-button type="primary" @click="saveBookkeeping('current', true)"
            >保存当前并簿记</el-button
          >
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, onUnmounted, reactive, ref } from 'vue'
import { ElButton, ElMessage, ElMessageBox, ElTable, ElTableColumn, ElTag } from 'element-plus'
import { RefreshLeft, Search } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

type ReconciliationCategory = 'opening' | 'closing'
type ExceptionType =
  'faucon-missing' | 'bct-missing' | 'field-mismatch' | 'historical-data-modified'
type HistorySourceChannel = 'BCT 同步' | '簿记修改'
type HistoryChangeType = 'update' | 'void'

interface FieldDifference {
  field: string
  fauconValue: string
  bctValue: string
}

interface HistoricalDataChange {
  source: '簿记修改'
  field: string
  originalValue: string
  modifiedValue: string
  modifiedBy: string
  modifiedAt: string
}

interface HistoryChangeRecord {
  id: string
  transactionNo: string
  backToBackContract: string
  accountType: string
  changeType: HistoryChangeType
  modificationItem: string
  sourceChannel: HistorySourceChannel
  originalValue: string
  modifiedValue: string
  modifiedBy: string
  modifiedAt: string
  approvedBy: string
  approvedAt: string
  coverReason: string
  larkPushStatus: '已推送' | '待推送'
  snapshotFields: SnapshotField[]
}

interface SnapshotField {
  key: string
  label: string
  beforeValue: string
  afterValue: string
  changed: boolean
}

interface HistoryChangeGroup {
  id: string
  transactionNo: string
  backToBackContract: string
  accountType: string
  recordCount: number
  latestChangeType: HistoryChangeType
  latestSourceChannel: HistorySourceChannel
  latestModifiedBy: string
  latestModifiedAt: string
  latestApprovedBy: string
  latestApprovedAt: string
  records: HistoryChangeRecord[]
}

interface ScrollableTableInstance {
  setScrollLeft: (scrollLeft: number) => void
}

interface HistoryChangeDraft {
  modificationItem: string
  sourceChannel: HistorySourceChannel
  originalValue: string
  modifiedValue: string
  modifiedBy: string
  modifiedAt: string
}

interface BookkeepingException {
  id: string
  category: ReconciliationCategory
  exceptionType: ExceptionType
  transactionNo: string
  backToBackContract: string
  underlyingCode: string
  counterparty: string
  account: string
  tradeDate: string
  term: string
  differences: FieldDifference[]
  historicalDataChanges?: HistoricalDataChange[]
}

interface FilterForm {
  transactionNo: string
  backToBackContract: string
  category: ReconciliationCategory | ''
  tradeDate: string
}

interface HistoryFilterForm {
  transactionNo: string
  changeType: HistoryChangeType | ''
  accountType: string
  modifiedAtRange: [string, string] | []
}

interface BookkeepingField {
  key: string
  label: string
  value: string
  editable?: boolean
  readonly?: boolean
}

interface BookkeepingSection {
  id: string
  title: string
  description: string
  fields: BookkeepingField[]
}

const exceptions = ref<BookkeepingException[]>([
  {
    id: 'opening-001',
    category: 'opening',
    exceptionType: 'field-mismatch',
    transactionNo: 'OT20260818001',
    backToBackContract: 'B2B-20260818-001',
    underlyingCode: '000001.SZ',
    counterparty: 'test_option',
    account: 'CICC-001',
    tradeDate: '2026-08-18',
    term: '3M',
    differences: [
      { field: '行权价', fauconValue: '10.80', bctValue: '10.75' },
      { field: '名义本金', fauconValue: '2,000 万 CNY', bctValue: '1,800 万 CNY' },
      { field: '前端期权费率', fauconValue: '5.50%', bctValue: '5.30%' },
    ],
  },
  {
    id: 'opening-002',
    category: 'opening',
    exceptionType: 'bct-missing',
    transactionNo: 'OT20260819008',
    backToBackContract: 'B2B-20260819-008',
    underlyingCode: '600519.SH',
    counterparty: 'CWI04_option',
    account: 'CICC-002',
    tradeDate: '2026-08-19',
    term: '4M',
    differences: [{ field: '整笔开仓记录', fauconValue: '我方未同步处理', bctValue: 'BCT撤销' }],
  },
  {
    id: 'opening-003',
    category: 'opening',
    exceptionType: 'faucon-missing',
    transactionNo: 'OT20260820013',
    backToBackContract: 'B2B-20260820-013',
    underlyingCode: '000858.SZ',
    counterparty: 'CWI04_option',
    account: 'CICC-003',
    tradeDate: '2026-08-20',
    term: '3M',
    differences: [{ field: '整笔开仓记录', fauconValue: '我方已作废', bctValue: 'BCT撤销' }],
  },
  {
    id: 'closing-001',
    category: 'closing',
    exceptionType: 'field-mismatch',
    transactionNo: 'CT20260825003',
    backToBackContract: 'B2B-20260818-001',
    underlyingCode: '000001.SZ',
    counterparty: 'CICC_option',
    account: 'CICC-001',
    tradeDate: '2026-08-25',
    term: '3M',
    differences: [
      { field: '平仓名义本金', fauconValue: '800 万 CNY', bctValue: '1,000 万 CNY' },
      { field: '平仓价', fauconValue: '11.20', bctValue: '11.15' },
    ],
  },
  {
    id: 'closing-002',
    category: 'closing',
    exceptionType: 'bct-missing',
    transactionNo: 'CT20260826011',
    backToBackContract: 'B2B-20260819-008',
    underlyingCode: '600519.SH',
    counterparty: 'CHEN SHAOZHONG_option',
    account: 'CICC-002',
    tradeDate: '2026-08-26',
    term: '4M',
    differences: [{ field: '整笔平仓记录', fauconValue: '我方未同步处理', bctValue: 'BCT撤销' }],
  },
  {
    id: 'closing-003',
    category: 'closing',
    exceptionType: 'faucon-missing',
    transactionNo: 'CT20260827004',
    backToBackContract: 'B2B-20260820-013',
    underlyingCode: '000858.SZ',
    counterparty: 'test_option',
    account: 'CICC-003',
    tradeDate: '2026-08-27',
    term: '3M',
    differences: [{ field: '整笔平仓记录', fauconValue: '我方已作废', bctValue: 'BCT撤销' }],
  },
  {
    id: 'opening-004',
    category: 'opening',
    exceptionType: 'historical-data-modified',
    transactionNo: 'OPT-2172007-2601298001',
    backToBackContract: 'B2B-20260828-005',
    underlyingCode: '000858.SZ',
    counterparty: 'test_option',
    account: 'CICC-003',
    tradeDate: '2026-08-28',
    term: '3M',
    differences: [
      { field: '前端期权费率', fauconValue: '4.50%', bctValue: '4.60%' },
      { field: '当前名义本金', fauconValue: '2,000 万 CNY', bctValue: '1,800 万 CNY' },
    ],
    historicalDataChanges: [
      {
        source: '簿记修改',
        field: '前端期权费率',
        originalValue: '4.50%',
        modifiedValue: '4.60%',
        modifiedBy: '李明',
        modifiedAt: '2026-09-01 16:42:13',
      },
      {
        source: '簿记修改',
        field: '当前名义本金',
        originalValue: '2,000 万 CNY',
        modifiedValue: '1,800 万 CNY',
        modifiedBy: '李明',
        modifiedAt: '2026-09-01 16:42:13',
      },
    ],
  },
])

const snapshotFieldDefinitions = [
  { key: 'accountType', label: '账户类型' },
  { key: 'counterparty', label: '交易对手' },
  { key: 'backToBackContract', label: '背靠背合约编号' },
  { key: 'underlying', label: '标的' },
  { key: 'direction', label: '方向' },
  { key: 'openCloseType', label: '开平类型' },
  { key: 'optionDirection', label: '期权方向' },
  { key: 'initialNotional', label: '期初名义本金' },
  { key: 'currentNotional', label: '当前名义本金' },
  { key: 'remainingNotional', label: '剩余名义本金' },
  { key: 'optionPremiumRate', label: '期权费率（%）' },
  { key: 'quoteParty', label: '报价方' },
  { key: 'userName', label: '用户名称' },
  { key: 'fundAccount', label: '资金账号' },
  { key: 'congruentAccountStatus', label: '同余账号状态' },
  { key: 'ourRole', label: '我方角色' },
  { key: 'bookkeepingAt', label: '簿记时间' },
  { key: 'transactionNo', label: '交易编号' },
  { key: 'tradeDate', label: '交易日期' },
]

type SnapshotBaseValues = Record<string, string>

const sampleClientSnapshotValues: SnapshotBaseValues = {
  accountType: '客户账号',
  counterparty: 'YAO YUAN_option',
  underlying: '全新好（000007.SZ）',
  direction: '卖',
  openCloseType: '开仓',
  optionDirection: '看涨',
  initialNotional: '2,000,000',
  currentNotional: '—',
  remainingNotional: '0',
  optionPremiumRate: '20.00%',
  quoteParty: '中金',
  userName: 'YAO YUAN_option',
  fundAccount: 'CW0257_option_CNY',
  congruentAccountStatus: '正常',
  ourRole: '乙方',
  bookkeepingAt: '2026-09-01 10:58:13',
  tradeDate: '—',
  coverReason: '—',
}

const sampleInternalSellSnapshotValues: SnapshotBaseValues = {
  accountType: '内部账号-卖',
  counterparty: 'CWI04_option',
  underlying: '全新好（000007.SZ）',
  direction: '买',
  openCloseType: '开仓',
  optionDirection: '看涨',
  initialNotional: '2,000,000',
  currentNotional: '—',
  remainingNotional: '0',
  optionPremiumRate: '20.00%',
  quoteParty: '中金',
  userName: 'CWI04_option',
  fundAccount: 'CWI04_option_CNY',
  congruentAccountStatus: '正常',
  ourRole: '甲方',
  bookkeepingAt: '2026-09-01 10:58:13',
  tradeDate: '—',
  coverReason: '—',
}

const snapshotFieldKeyByModificationItem: Record<string, string> = {
  '期权费率(%)': 'optionPremiumRate',
  '期权费率（%）': 'optionPremiumRate',
  前端期权费率: 'optionPremiumRate',
  当前名义本金: 'currentNotional',
  剩余名义本金: 'remainingNotional',
  期初名义本金: 'initialNotional',
  交易对手: 'counterparty',
  背靠背合约: 'backToBackContract',
  资金账号: 'fundAccount',
  交易日期: 'tradeDate',
}

function snapshotFieldKey(modificationItem: string) {
  return snapshotFieldKeyByModificationItem[modificationItem] ?? modificationItem
}

function createSnapshotFields(
  record: Pick<HistoryChangeRecord, 'transactionNo' | 'backToBackContract' | 'accountType'>,
  changes: Record<string, string> = {},
  beforeOverrides: Record<string, string> = {},
  snapshotBaseValues: SnapshotBaseValues = sampleClientSnapshotValues,
): SnapshotField[] {
  const baseValues: SnapshotBaseValues = {
    ...snapshotBaseValues,
    accountType: record.accountType,
    backToBackContract: record.backToBackContract,
    transactionNo: record.transactionNo,
  }
  const knownFields = snapshotFieldDefinitions.map((field) => ({
    key: field.key,
    label: field.label,
    beforeValue: beforeOverrides[field.key] ?? baseValues[field.key] ?? '—',
    afterValue: changes[field.key] ?? beforeOverrides[field.key] ?? baseValues[field.key] ?? '—',
    changed: Object.prototype.hasOwnProperty.call(changes, field.key),
  }))
  const supplementalFields = Object.entries(changes)
    .filter(([key]) => !snapshotFieldDefinitions.some((field) => field.key === key))
    .map(([key, afterValue]) => ({
      key,
      label: key,
      beforeValue: beforeOverrides[key] ?? '—',
      afterValue,
      changed: true,
    }))

  return [...knownFields, ...supplementalFields]
}

function createVoidSnapshotFields(
  record: Pick<HistoryChangeRecord, 'transactionNo' | 'backToBackContract' | 'accountType'>,
  snapshotBaseValues?: SnapshotBaseValues,
) {
  return createSnapshotFields(record, {}, {}, snapshotBaseValues)
}

const historyChanges = ref<HistoryChangeRecord[]>([
  {
    id: 'history-001',
    transactionNo: 'OPT-2172007-2601289008',
    backToBackContract: 'CICC-OPT-2172007-2601289008',
    accountType: '客户账号',
    changeType: 'update',
    modificationItem: '期权费率（%）',
    sourceChannel: 'BCT 同步',
    originalValue: '19.00%',
    modifiedValue: '20.00%',
    modifiedBy: 'BCT 系统',
    modifiedAt: '2026-09-01 11:06:18',
    approvedBy: '王敏',
    approvedAt: '2026-09-01 11:18:46',
    coverReason: 'BCT 同步期权费率变更',
    larkPushStatus: '已推送',
    snapshotFields: createSnapshotFields(
      {
        transactionNo: 'OPT-2172007-2601289008',
        backToBackContract: 'CICC-OPT-2172007-2601289008',
        accountType: '客户账号',
      },
      { optionPremiumRate: '20.00%' },
      { optionPremiumRate: '19.00%' },
      { ...sampleClientSnapshotValues, coverReason: 'BCT 同步期权费率变更' },
    ),
  },
  {
    id: 'history-002',
    transactionNo: 'OPT-2172007-2601289008',
    backToBackContract: 'CICC-OPT-2172007-2601289008',
    accountType: '客户账号',
    changeType: 'update',
    modificationItem: '剩余名义本金',
    sourceChannel: '簿记修改',
    originalValue: '2,000,000',
    modifiedValue: '0',
    modifiedBy: 'YAO YUAN_option',
    modifiedAt: '2026-09-01 14:42:13',
    approvedBy: '王敏',
    approvedAt: '2026-09-01 15:06:30',
    coverReason: '业务人员提交修改，审批后覆盖原有值',
    larkPushStatus: '已推送',
    snapshotFields: createSnapshotFields(
      {
        transactionNo: 'OPT-2172007-2601289008',
        backToBackContract: 'CICC-OPT-2172007-2601289008',
        accountType: '客户账号',
      },
      { remainingNotional: '0' },
      { remainingNotional: '2,000,000', optionPremiumRate: '20.00%' },
      { ...sampleClientSnapshotValues, coverReason: '业务人员提交修改，审批后覆盖原有值' },
    ),
  },
  {
    id: 'history-003',
    transactionNo: 'OPT-2172007-2601289009',
    backToBackContract: 'CICC-OPT-2172007-2601289008',
    accountType: '内部账号-卖',
    changeType: 'void',
    modificationItem: '簿记状态',
    sourceChannel: 'BCT 同步',
    originalValue: '已簿记',
    modifiedValue: '已作废',
    modifiedBy: 'BCT 系统',
    modifiedAt: '2026-09-02 09:18:42',
    approvedBy: '王敏',
    approvedAt: '2026-09-02 09:22:10',
    coverReason: 'BCT 撤销后作废簿记',
    larkPushStatus: '已推送',
    snapshotFields: createVoidSnapshotFields(
      {
        transactionNo: 'OPT-2172007-2601289009',
        backToBackContract: 'CICC-OPT-2172007-2601289008',
        accountType: '内部账号-卖',
      },
      { ...sampleInternalSellSnapshotValues, coverReason: 'BCT 撤销后作废簿记' },
    ),
  },
  {
    id: 'history-004',
    transactionNo: 'OPT-2172007-2601299001',
    backToBackContract: 'CICC-OPT-2172007-2601299001',
    accountType: '内部账号-买',
    changeType: 'update',
    modificationItem: '资金账号',
    sourceChannel: '簿记修改',
    originalValue: 'CICC-002',
    modifiedValue: 'CICC-003',
    modifiedBy: '李明',
    modifiedAt: '2026-09-02 10:32:18',
    approvedBy: '王敏',
    approvedAt: '2026-09-02 10:48:36',
    coverReason: '资金账号调整后覆盖原有值',
    larkPushStatus: '已推送',
    snapshotFields: createSnapshotFields(
      {
        transactionNo: 'OPT-2172007-2601299001',
        backToBackContract: 'CICC-OPT-2172007-2601299001',
        accountType: '内部账号-买',
      },
      { fundAccount: 'CICC-003' },
      { fundAccount: 'CICC-002' },
      {
        ...sampleClientSnapshotValues,
        fundAccount: 'CICC-002',
        coverReason: '资金账号调整后覆盖原有值',
      },
    ),
  },
  {
    id: 'history-004a',
    transactionNo: 'OPT-2172007-2601299001',
    backToBackContract: 'CICC-OPT-2172007-2601299001',
    accountType: '内部账号-买',
    changeType: 'update',
    modificationItem: '交易日期',
    sourceChannel: '簿记修改',
    originalValue: '—',
    modifiedValue: '2026-08-29',
    modifiedBy: '李明',
    modifiedAt: '2026-09-02 10:38:42',
    approvedBy: '王敏',
    approvedAt: '2026-09-02 10:43:18',
    coverReason: '补充交易日期后覆盖原有值',
    larkPushStatus: '已推送',
    snapshotFields: createSnapshotFields(
      {
        transactionNo: 'OPT-2172007-2601299001',
        backToBackContract: 'CICC-OPT-2172007-2601299001',
        accountType: '内部账号-买',
      },
      { tradeDate: '2026-08-29' },
      { tradeDate: '—' },
      {
        ...sampleClientSnapshotValues,
        fundAccount: 'CICC-003',
        coverReason: '补充交易日期后覆盖原有值',
      },
    ),
  },
  {
    id: 'history-004b',
    transactionNo: 'OPT-2172007-2601299001',
    backToBackContract: 'CICC-OPT-2172007-2601299001',
    accountType: '内部账号-买',
    changeType: 'update',
    modificationItem: '期权费率（%）',
    sourceChannel: 'BCT 同步',
    originalValue: '20.00%',
    modifiedValue: '20.50%',
    modifiedBy: 'BCT 系统',
    modifiedAt: '2026-09-02 10:42:57',
    approvedBy: '王敏',
    approvedAt: '2026-09-02 10:47:31',
    coverReason: 'BCT 同步期权费率变更',
    larkPushStatus: '已推送',
    snapshotFields: createSnapshotFields(
      {
        transactionNo: 'OPT-2172007-2601299001',
        backToBackContract: 'CICC-OPT-2172007-2601299001',
        accountType: '内部账号-买',
      },
      { optionPremiumRate: '20.50%' },
      { optionPremiumRate: '20.00%', tradeDate: '2026-08-29' },
      {
        ...sampleClientSnapshotValues,
        fundAccount: 'CICC-003',
        tradeDate: '2026-08-29',
        coverReason: 'BCT 同步期权费率变更',
      },
    ),
  },
  {
    id: 'history-004c',
    transactionNo: 'OPT-2172007-2601299001',
    backToBackContract: 'CICC-OPT-2172007-2601299001',
    accountType: '内部账号-买',
    changeType: 'update',
    modificationItem: '交易对手',
    sourceChannel: '簿记修改',
    originalValue: 'YAO YUAN_option',
    modifiedValue: 'CWI04_option',
    modifiedBy: '张宁',
    modifiedAt: '2026-09-02 10:46:26',
    approvedBy: '赵倩',
    approvedAt: '2026-09-02 10:50:44',
    coverReason: '交易对手信息维护后覆盖原有值',
    larkPushStatus: '已推送',
    snapshotFields: createSnapshotFields(
      {
        transactionNo: 'OPT-2172007-2601299001',
        backToBackContract: 'CICC-OPT-2172007-2601299001',
        accountType: '内部账号-买',
      },
      { counterparty: 'CWI04_option' },
      {
        counterparty: 'YAO YUAN_option',
        optionPremiumRate: '20.50%',
        tradeDate: '2026-08-29',
      },
      {
        ...sampleClientSnapshotValues,
        fundAccount: 'CICC-003',
        optionPremiumRate: '20.50%',
        tradeDate: '2026-08-29',
        coverReason: '交易对手信息维护后覆盖原有值',
      },
    ),
  },
  {
    id: 'history-004d',
    transactionNo: 'OPT-2172007-2601299001',
    backToBackContract: 'CICC-OPT-2172007-2601299001',
    accountType: '内部账号-买',
    changeType: 'update',
    modificationItem: '当前名义本金',
    sourceChannel: 'BCT 同步',
    originalValue: '—',
    modifiedValue: '1,800,000',
    modifiedBy: 'BCT 系统',
    modifiedAt: '2026-09-02 10:51:09',
    approvedBy: '赵倩',
    approvedAt: '2026-09-02 10:55:23',
    coverReason: 'BCT 同步名义本金变更',
    larkPushStatus: '已推送',
    snapshotFields: createSnapshotFields(
      {
        transactionNo: 'OPT-2172007-2601299001',
        backToBackContract: 'CICC-OPT-2172007-2601299001',
        accountType: '内部账号-买',
      },
      { currentNotional: '1,800,000' },
      {
        currentNotional: '—',
        counterparty: 'CWI04_option',
        optionPremiumRate: '20.50%',
        tradeDate: '2026-08-29',
      },
      {
        ...sampleClientSnapshotValues,
        fundAccount: 'CICC-003',
        counterparty: 'CWI04_option',
        optionPremiumRate: '20.50%',
        tradeDate: '2026-08-29',
        coverReason: 'BCT 同步名义本金变更',
      },
    ),
  },
  {
    id: 'history-004e',
    transactionNo: 'OPT-2172007-2601299001',
    backToBackContract: 'CICC-OPT-2172007-2601299001',
    accountType: '内部账号-买',
    changeType: 'update',
    modificationItem: '报价方',
    sourceChannel: '簿记修改',
    originalValue: '中金',
    modifiedValue: '中信建投',
    modifiedBy: '李明',
    modifiedAt: '2026-09-02 10:57:38',
    approvedBy: '王敏',
    approvedAt: '2026-09-02 11:03:17',
    coverReason: '报价方信息维护后覆盖原有值',
    larkPushStatus: '已推送',
    snapshotFields: createSnapshotFields(
      {
        transactionNo: 'OPT-2172007-2601299001',
        backToBackContract: 'CICC-OPT-2172007-2601299001',
        accountType: '内部账号-买',
      },
      { quoteParty: '中信建投' },
      {
        quoteParty: '中金',
        currentNotional: '1,800,000',
        counterparty: 'CWI04_option',
        optionPremiumRate: '20.50%',
        tradeDate: '2026-08-29',
      },
      {
        ...sampleClientSnapshotValues,
        fundAccount: 'CICC-003',
        counterparty: 'CWI04_option',
        currentNotional: '1,800,000',
        optionPremiumRate: '20.50%',
        quoteParty: '中信建投',
        tradeDate: '2026-08-29',
        coverReason: '报价方信息维护后覆盖原有值',
      },
    ),
  },
  {
    id: 'history-005',
    transactionNo: 'OPT-2172007-2601299001',
    backToBackContract: 'CICC-OPT-2172007-2601299001',
    accountType: '内部账号-买',
    changeType: 'void',
    modificationItem: '簿记状态',
    sourceChannel: 'BCT 同步',
    originalValue: '已簿记',
    modifiedValue: '已作废',
    modifiedBy: 'BCT 系统',
    modifiedAt: '2026-09-02 11:12:25',
    approvedBy: '王敏',
    approvedAt: '2026-09-02 11:20:14',
    coverReason: 'BCT 撤销后作废簿记',
    larkPushStatus: '已推送',
    snapshotFields: createVoidSnapshotFields(
      {
        transactionNo: 'OPT-2172007-2601299001',
        backToBackContract: 'CICC-OPT-2172007-2601299001',
        accountType: '内部账号-买',
      },
      {
        ...sampleClientSnapshotValues,
        fundAccount: 'CICC-003',
        counterparty: 'CWI04_option',
        currentNotional: '1,800,000',
        optionPremiumRate: '20.50%',
        quoteParty: '中信建投',
        tradeDate: '2026-08-29',
        coverReason: 'BCT 撤销后作废簿记',
      },
    ),
  },
  {
    id: 'history-006',
    transactionNo: 'OPT-2172007-2601300026',
    backToBackContract: 'CICC-OPT-2172007-2601300026',
    accountType: '对冲账号',
    changeType: 'update',
    modificationItem: '交易对手',
    sourceChannel: 'BCT 同步',
    originalValue: 'CWI04_option',
    modifiedValue: 'CHEN SHAOZHONG_option',
    modifiedBy: 'BCT 系统',
    modifiedAt: '2026-09-02 13:26:47',
    approvedBy: '赵倩',
    approvedAt: '2026-09-02 13:42:09',
    coverReason: 'BCT 同步交易对手变更',
    larkPushStatus: '已推送',
    snapshotFields: createSnapshotFields(
      {
        transactionNo: 'OPT-2172007-2601300026',
        backToBackContract: 'CICC-OPT-2172007-2601300026',
        accountType: '对冲账号',
      },
      { counterparty: 'CHEN SHAOZHONG_option' },
      { counterparty: 'CWI04_option' },
      {
        ...sampleInternalSellSnapshotValues,
        initialNotional: '2,100,000',
        coverReason: 'BCT 同步交易对手变更',
      },
    ),
  },
  {
    id: 'history-007',
    transactionNo: 'OPT-2172007-2601300026',
    backToBackContract: 'CICC-OPT-2172007-2601300026',
    accountType: '对冲账号',
    changeType: 'update',
    modificationItem: '期初名义本金',
    sourceChannel: '簿记修改',
    originalValue: '2,000,000',
    modifiedValue: '2,100,000',
    modifiedBy: '李明',
    modifiedAt: '2026-09-03 15:26:47',
    approvedBy: '赵倩',
    approvedAt: '2026-09-03 15:38:12',
    coverReason: '期初名义本金维护后覆盖原有值',
    larkPushStatus: '已推送',
    snapshotFields: createSnapshotFields(
      {
        transactionNo: 'OPT-2172007-2601300026',
        backToBackContract: 'CICC-OPT-2172007-2601300026',
        accountType: '对冲账号',
      },
      { initialNotional: '2,100,000' },
      { initialNotional: '2,100,000', counterparty: 'CHEN SHAOZHONG_option' },
      {
        ...sampleInternalSellSnapshotValues,
        counterparty: 'CHEN SHAOZHONG_option',
        initialNotional: '2,100,000',
        coverReason: '期初名义本金维护后覆盖原有值',
      },
    ),
  },
])

const exceptionTagTypes: Record<ExceptionType, 'warning' | 'info' | 'danger' | 'primary'> = {
  'faucon-missing': 'warning',
  'bct-missing': 'info',
  'field-mismatch': 'danger',
  'historical-data-modified': 'primary',
}

const bookkeepingAccountTabs = [
  { name: 'client', label: '客户账号' },
  { name: 'proprietary-sell', label: '内部账号-卖' },
  { name: 'proprietary-buy', label: '内部账号-买' },
  { name: 'hedge', label: '对冲账户' },
]

const historyAccountTypes = ['客户账号', '内部账号-买', '内部账号-卖', '对冲账号']

const bookkeepingSelectOptions: Record<string, string[]> = {
  tradeRival: ['test_option', 'CWI04_option', 'CICC_option', 'CHEN SHAOZHONG_option'],
  fundAccount: ['CICC-001', 'CICC-002', 'CICC-003'],
  dividendRule: ['不调整', '向上调整', '向下调整'],
  knockoutRule: ['无敲出', '触发敲出'],
  earliestExerciseDate: ['期末观察日', '到期日'],
  settlementCurrency: ['CNY', 'HKD', 'USD'],
  fullUnwind: ['否', '是'],
}

const bookkeepingDateFields = new Set([
  'beginDate',
  'finalValuationDate',
  'settlementDate',
  'expiryDate',
  'frontPremiumPaymentDate',
  'unwindDate',
  'optionSettlementPaymentDate',
])

const openingRequiredFields = new Set([
  'tradeRival',
  'term',
  'strikeRatio',
  'participationRate',
  'beginDate',
  'dividendRule',
  'knockoutRule',
  'earliestExerciseDate',
  'notional',
  'frontPremiumRate',
  'initialPrice',
  'strikePrice',
  'finalValuationDate',
  'settlementDate',
  'settlementCurrency',
  'fundAccount',
  'expiryDate',
  'frontPremiumPaymentDate',
  'minimumYield',
])

const closingRequiredFields = new Set([
  'unwindNotional',
  'unwindPrice',
  'optionSettlementPayment',
  'unwindDate',
  'optionSettlementPaymentDate',
])

const openingBookkeepingSections: BookkeepingSection[] = [
  {
    id: 'option-elements',
    title: '期权要素',
    description: '标的、期限与核心期权参数',
    fields: [
      { key: 'tradeRival', label: '交易对手', value: 'CWI04_option', editable: true },
      { key: 'underlyingCode', label: '标的代码', value: '000858.SZ' },
      { key: 'underlyingName', label: '标的名称', value: '五粮液' },
      { key: 'term', label: '期限', value: '3M' },
      { key: 'strikeRatio', label: '行权价系数', value: '100.00%', editable: true },
      { key: 'participationRate', label: '参与率', value: '100.00%', editable: true },
      { key: 'beginDate', label: '起始日', value: '2026-08-20', editable: true },
      { key: 'finalValuationDate', label: '期末观察日', value: '2026-11-18', editable: true },
      { key: 'settlementDate', label: '结算日', value: '2026-11-23', editable: true },
      { key: 'settlementCurrency', label: '结算币种', value: 'CNY', editable: true },
      { key: 'initialPrice', label: '期初价格', value: '118.00', editable: true },
      { key: 'strikePrice', label: '行权价', value: '118.00' },
      { key: 'dividendRule', label: '分红规则', value: '不调整', editable: true },
      { key: 'knockoutRule', label: '敲出规则', value: '无', editable: true },
      { key: 'earliestExerciseDate', label: '最快行权日', value: '2026-11-18', editable: true },
      { key: 'notional', label: '名义本金', value: '2,000 万 CNY', editable: true },
      { key: 'frontPremiumRate', label: '前端期权费率', value: '5.50%', editable: true },
    ],
  },
  {
    id: 'trade-info',
    title: '交易信息',
    description: '交易主体、账号与日历配置',
    fields: [
      { key: 'tradeNo', label: '交易编号', value: 'OPT-2172007-2601299001' },
      { key: 'fundAccount', label: '资金账号', value: 'CICC-003', editable: true },
      { key: 'dealDate', label: '交易达成日', value: '2026-08-20' },
      { key: 'tradeCurrency', label: '交易币种', value: 'CNY' },
      { key: 'ourRole', label: '我方角色', value: '自营卖方' },
      { key: 'buySellDirection', label: '买卖方向', value: '买入' },
      { key: 'tradeCalendar', label: '交易日历', value: '中国大陆交易日历' },
    ],
  },
  {
    id: 'basic-info',
    title: '基础信息',
    description: '簿记、订单及合约基础属性',
    fields: [
      { key: 'tradeBook', label: '簿记主体', value: 'FAUCON TRADE' },
      { key: 'structure', label: '结构类型', value: '香草期权' },
      { key: 'businessType', label: '业务类型', value: '场外期权' },
      { key: 'optionType', label: '期权类型', value: '看涨期权' },
      { key: 'optionOrderNo', label: '期权订单编号', value: 'ORD-20260820-013', editable: true },
      { key: 'tradeBookNo', label: '交易确认书编号', value: 'TB-20260820-013' },
    ],
  },
  {
    id: 'date-info',
    title: '日期信息',
    description: '费用支付与到期安排',
    fields: [
      { key: 'expiryDate', label: '到期日', value: '2026-11-20', editable: true },
      {
        key: 'frontPremiumPaymentDate',
        label: '前端期权费支付日',
        value: '2026-08-21',
        editable: true,
      },
    ],
  },
  {
    id: 'fee-info',
    title: '费率信息',
    description: '收益与期权费计算属性',
    fields: [
      { key: 'dealPriceType', label: '期初价格类型', value: '收盘价' },
      { key: 'endPriceType', label: '期末价格类型', value: '收盘价' },
      { key: 'minimumYield', label: '最低收益率', value: '0.00%', editable: true },
      { key: 'premiumType', label: '期权费类型', value: '前端支付' },
    ],
  },
  {
    id: 'interest-rule',
    title: '计息规则',
    description: '年化及计息天数配置',
    fields: [
      { key: 'annualized', label: '是否年化', value: '是' },
      { key: 'annualizedDays', label: '年化天数', value: '365' },
      { key: 'calcDaysType', label: '计息天数计算', value: '实际天数' },
      { key: 'calcDaysDeadlineType', label: '计息截止日类型', value: '包含到期日' },
    ],
  },
  {
    id: 'precision-config',
    title: '精度配置',
    description: '价格、金额与百分比显示精度',
    fields: [
      { key: 'pricePrecision', label: '价格精度', value: '2' },
      { key: 'amountPrecision', label: '金额精度', value: '2' },
      { key: 'percentagePrecision', label: '百分比精度', value: '4' },
    ],
  },
  {
    id: 'back-to-back-info',
    title: '背靠背信息',
    description: '上下游合约关联关系',
    fields: [
      { key: 'backToBackLabel', label: '背靠背标签', value: 'CICC' },
      { key: 'backToBackContract', label: '背靠背合约', value: 'B2B-20260820-013' },
    ],
  },
]

const closingBookkeepingSections: BookkeepingSection[] = [
  {
    id: 'option-elements',
    title: '期权要素',
    description: '原期权信息与本次平仓参数',
    fields: [
      { key: 'underlyingCode', label: '标的代码', value: '000001.SZ' },
      { key: 'underlyingName', label: '标的名称', value: '平安银行' },
      { key: 'optionType', label: '期权类型', value: '看涨期权' },
      { key: 'term', label: '期限', value: '3M' },
      { key: 'initialNotional', label: '期初名义本金', value: '2,000 万 CNY' },
      { key: 'availableNotional', label: '可平仓名义本金', value: '2,000 万 CNY' },
      { key: 'unwindNotional', label: '平仓名义本金', value: '800 万 CNY', editable: true },
      { key: 'remainingNotional', label: '剩余名义本金', value: '1,200 万 CNY' },
      { key: 'unwindDate', label: '平仓日', value: '2026-08-25', editable: true },
      { key: 'unwindPrice', label: '平仓价', value: '11.20', editable: true },
      { key: 'initialPrice', label: '期初价格', value: '10.80' },
      { key: 'strikePrice', label: '行权价', value: '10.80' },
      { key: 'frontPremiumRate', label: '前端期权费率', value: '5.50%' },
      { key: 'initialPremium', label: '前端期权费', value: '110 万 CNY' },
    ],
  },
  {
    id: 'trade-info',
    title: '交易信息',
    description: '交易主体与账户归属',
    fields: [
      { key: 'tradeNo', label: '交易编号', value: 'OPT-2172007-2601299001' },
      { key: 'tradeRival', label: '交易对手', value: 'CICC_option' },
      { key: 'fundAccount', label: '资金账号', value: 'CICC-001' },
      { key: 'buySellDirection', label: '买卖方向', value: '卖出' },
      { key: 'ourRole', label: '我方角色', value: '自营卖方' },
      { key: 'tradeCurrency', label: '交易币种', value: 'CNY' },
    ],
  },
  {
    id: 'basic-info',
    title: '基础信息',
    description: '合约及确认书基础属性',
    fields: [
      { key: 'structure', label: '结构类型', value: '香草期权' },
      { key: 'businessType', label: '业务类型', value: '场外期权' },
      { key: 'tradeBookNo', label: '交易确认书编号', value: 'TB-20260818-001' },
      { key: 'unwindConfirmationId', label: '平仓确认书编号', value: 'UC-20260825-003' },
    ],
  },
  {
    id: 'close-info',
    title: '平仓信息',
    description: '平仓方式及本金余额',
    fields: [
      { key: 'fullUnwind', label: '是否全平', value: '否', readonly: true },
      { key: 'unwindExchangeRate', label: '平仓汇率', value: '1.0000' },
      { key: 'settlementCurrency', label: '结算币种', value: 'CNY' },
    ],
  },
  {
    id: 'settlement-payment',
    title: '结算支付信息',
    description: '期权结算支付及日期',
    fields: [
      {
        key: 'optionSettlementPayment',
        label: '期权结算支付金额',
        value: '36 万 CNY',
        editable: true,
      },
      {
        key: 'optionSettlementNotionalPayment',
        label: '名义币种支付金额',
        value: '36 万 CNY',
        editable: true,
      },
      {
        key: 'optionSettlementPaymentDate',
        label: '期权结算支付日',
        value: '2026-08-28',
        editable: true,
      },
    ],
  },
  {
    id: 'amount-fee-info',
    title: '金额费用信息',
    description: '平仓相关费用与摊销额',
    fields: [
      {
        key: 'frontPremiumAmortization',
        label: '期权费摊销额',
        value: '44 万 CNY',
        editable: true,
      },
    ],
  },
  {
    id: 'precision-config',
    title: '精度配置',
    description: '价格、金额与百分比显示精度',
    fields: [
      { key: 'pricePrecision', label: '价格精度', value: '2' },
      { key: 'amountPrecision', label: '金额精度', value: '2' },
      { key: 'percentagePrecision', label: '百分比精度', value: '4' },
    ],
  },
  {
    id: 'back-to-back-info',
    title: '背靠背信息',
    description: '上下游合约关联关系',
    fields: [
      { key: 'backToBackLabel', label: '背靠背标签', value: 'CICC' },
      { key: 'backToBackContract', label: '背靠背合约', value: 'B2B-20260818-001' },
    ],
  },
]

const userStore = useUserStore()
const canProcessBookkeepingApproval = computed(() =>
  userStore.hasPermission('option-bookkeeping:approval:process'),
)
const activeTab = ref('pending')
const draftFilters = reactive<FilterForm>(createFilterForm())
const appliedFilters = reactive<FilterForm>(createFilterForm())
const historyDraftFilters = reactive<HistoryFilterForm>(createHistoryFilterForm())
const historyAppliedFilters = reactive<HistoryFilterForm>(createHistoryFilterForm())
const exceptionCurrentPage = ref(1)
const exceptionPageSize = 100
const historyCurrentPage = ref(1)
const historyPageSize = 100
const activeSummaryExceptionType = ref<ExceptionType | ''>('')
const maintenanceRecord = ref<BookkeepingException | null>(null)
const historicalModificationRecord = ref<BookkeepingException | null>(null)
const bookkeepingRecord = ref<BookkeepingException | null>(null)
const bookkeepingAccountTab = ref('client')
const activeBookkeepingSection = ref('option-elements')
const bookkeepingForms = reactive<Record<string, Record<string, string>>>({})
const bookkeepingReason = ref('')
const maintenanceDialogVisible = computed({
  get: () => maintenanceRecord.value !== null,
  set: (visible: boolean) => {
    if (!visible) maintenanceRecord.value = null
  },
})
const bookkeepingDialogVisible = computed({
  get: () => bookkeepingRecord.value !== null,
  set: (visible: boolean) => {
    if (!visible) bookkeepingRecord.value = null
  },
})
const historicalModificationDialogVisible = computed({
  get: () => historicalModificationRecord.value !== null,
  set: (visible: boolean) => {
    if (!visible) historicalModificationRecord.value = null
  },
})
const maintenanceChoices = reactive<Record<string, 'faucon' | 'bct'>>({})
const maintenanceBulkChoice = ref<'faucon' | 'bct'>('faucon')
const maintenanceReason = ref('')
const historicalModificationChoice = ref<'approve' | 'reject'>('approve')
const dataLoadedAt = ref(formatDateTime(new Date()))
const isDataRefreshing = ref(false)
const historyTableScrollLeft = ref(0)
const snapshotTableRefs = new Map<string, ScrollableTableInstance>()
let autoRefreshTimer: ReturnType<typeof window.setInterval> | undefined

const filteredExceptions = computed(() =>
  exceptions.value.filter((item) => {
    return (
      includesText(item.transactionNo, appliedFilters.transactionNo) &&
      includesText(item.backToBackContract, appliedFilters.backToBackContract) &&
      (!appliedFilters.category || item.category === appliedFilters.category) &&
      (!appliedFilters.tradeDate || item.tradeDate === appliedFilters.tradeDate)
    )
  }),
)
const matchingExceptions = computed(() =>
  filteredExceptions.value.filter(
    (item) =>
      !activeSummaryExceptionType.value || item.exceptionType === activeSummaryExceptionType.value,
  ),
)
const pagedExceptions = computed(() => {
  const start = (exceptionCurrentPage.value - 1) * exceptionPageSize
  return matchingExceptions.value.slice(start, start + exceptionPageSize)
})
const historyChangeGroups = computed<HistoryChangeGroup[]>(() => {
  const grouped = new Map<string, HistoryChangeRecord[]>()
  const matchedRecords = historyChanges.value
    .filter(
      (item) =>
        includesText(item.transactionNo, historyAppliedFilters.transactionNo) &&
        (!historyAppliedFilters.changeType ||
          item.changeType === historyAppliedFilters.changeType) &&
        (!historyAppliedFilters.accountType ||
          item.accountType === historyAppliedFilters.accountType) &&
        isDateWithinRange(item.modifiedAt, historyAppliedFilters.modifiedAtRange),
    )
    .sort((left, right) => right.modifiedAt.localeCompare(left.modifiedAt))

  matchedRecords.forEach((record) => {
    const groupId = `${record.transactionNo}-${record.backToBackContract}-${record.accountType}`
    const records = grouped.get(groupId) ?? []
    records.push(record)
    grouped.set(groupId, records)
  })

  return Array.from(grouped.entries()).map(([id, records]) => {
    const latest = records[0]
    return {
      id,
      transactionNo: latest.transactionNo,
      backToBackContract: latest.backToBackContract,
      accountType: latest.accountType,
      recordCount: records.length,
      latestChangeType: latest.changeType,
      latestSourceChannel: latest.sourceChannel,
      latestModifiedBy: latest.modifiedBy,
      latestModifiedAt: latest.modifiedAt,
      latestApprovedBy: latest.approvedBy,
      latestApprovedAt: latest.approvedAt,
      records,
    }
  })
})
const pagedHistoryChangeGroups = computed(() => {
  const start = (historyCurrentPage.value - 1) * historyPageSize
  return historyChangeGroups.value.slice(start, start + historyPageSize)
})

const exceptionStats = computed(() => summarizeExceptions(filteredExceptions.value))
const maintenanceMatrixRows = computed(() => {
  const differences = maintenanceRecord.value?.differences ?? []
  const values = (source: 'faucon' | 'bct' | 'final') =>
    Object.fromEntries(
      differences.map((difference, index) => [
        `difference-${index}`,
        source === 'faucon'
          ? difference.fauconValue
          : source === 'bct'
            ? difference.bctValue
            : maintenanceChoices[difference.field] === 'bct'
              ? difference.bctValue
              : difference.fauconValue,
      ]),
    )

  return [
    { source: '猎盈值', ...values('faucon') },
    { source: 'BCT 值', ...values('bct') },
    { source: '最终值', ...values('final') },
  ]
})
const bookkeepingSections = computed(() =>
  bookkeepingRecord.value?.category === 'closing'
    ? closingBookkeepingSections
    : openingBookkeepingSections,
)
const activeBookkeepingForm = computed(
  () => bookkeepingForms[bookkeepingAccountTab.value] ?? ({} as Record<string, string>),
)
const historicalModificationRows = computed(() =>
  historicalDataChangesFor(historicalModificationRecord.value).map((change) => ({
    modificationItem: change.field,
    source: change.source,
    originalValue: change.originalValue,
    modifiedValue: change.modifiedValue,
    modifiedBy: change.modifiedBy,
    modifiedAt: change.modifiedAt,
  })),
)

const ExceptionTable = defineComponent({
  props: {
    rows: {
      type: Array as () => BookkeepingException[],
      required: true,
    },
    canProcess: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['process', 'void-bookkeeping'],
  setup(props, { emit }) {
    return () =>
      h('div', { class: 'option-bookkeeping-table-scroll' }, [
        h(
          ElTable,
          {
            data: props.rows,
            rowKey: 'id',
            class: 'option-bookkeeping-exception-table',
            emptyText: '暂无符合条件的异常记录',
          },
          {
            default: () => [
              h(
                ElTableColumn,
                { type: 'expand', width: 44, fixed: 'left' },
                {
                  default: ({ row }: { row: BookkeepingException }) =>
                    h('div', { class: 'option-bookkeeping-differences' }, [
                      h('h3', '异常明细'),
                      h(
                        ElTable,
                        {
                          data:
                            row.exceptionType === 'historical-data-modified'
                              ? historicalDataChangesFor(row).map((change) => ({
                                  modificationItem: change.field,
                                  source: change.source,
                                  originalValue: change.originalValue,
                                  modifiedValue: change.modifiedValue,
                                  modifiedBy: change.modifiedBy,
                                  modifiedAt: change.modifiedAt,
                                }))
                              : [
                                  {
                                    source: '猎盈值',
                                    ...Object.fromEntries(
                                      row.differences.map((difference, index) => [
                                        `difference-${index}`,
                                        difference.fauconValue,
                                      ]),
                                    ),
                                  },
                                  {
                                    source: 'BCT 值',
                                    ...Object.fromEntries(
                                      row.differences.map((difference, index) => [
                                        `difference-${index}`,
                                        difference.bctValue,
                                      ]),
                                    ),
                                  },
                                ],
                          size: 'small',
                          class: 'option-bookkeeping-differences-table',
                        },
                        {
                          default: () =>
                            row.exceptionType === 'historical-data-modified'
                              ? [
                                  h(ElTableColumn, {
                                    prop: 'modificationItem',
                                    label: '修改项',
                                    minWidth: 160,
                                  }),
                                  h(ElTableColumn, {
                                    prop: 'source',
                                    label: '数据来源',
                                    minWidth: 160,
                                  }),
                                  h(ElTableColumn, {
                                    prop: 'originalValue',
                                    label: '原始值',
                                    minWidth: 160,
                                  }),
                                  h(ElTableColumn, {
                                    prop: 'modifiedValue',
                                    label: '修改值',
                                    minWidth: 160,
                                  }),
                                  h(ElTableColumn, {
                                    prop: 'modifiedBy',
                                    label: '修改人',
                                    minWidth: 120,
                                  }),
                                  h(ElTableColumn, {
                                    prop: 'modifiedAt',
                                    label: '修改时间',
                                    minWidth: 180,
                                  }),
                                ]
                              : [
                                  h(ElTableColumn, {
                                    prop: 'source',
                                    label: '数据来源',
                                    width: 118,
                                  }),
                                  ...row.differences.map((difference, index) =>
                                    h(ElTableColumn, {
                                      prop: `difference-${index}`,
                                      label: difference.field,
                                      minWidth: differenceColumnMinWidth(difference),
                                    }),
                                  ),
                                ],
                        },
                      ),
                    ]),
                },
              ),
              h(
                ElTableColumn,
                { label: '异常类型', width: 116, align: 'center' },
                {
                  default: ({ row }: { row: BookkeepingException }) =>
                    h(
                      ElTag,
                      {
                        type: exceptionTagType(row.exceptionType),
                        effect: 'light',
                        class: [
                          'option-bookkeeping-exception-tag',
                          `option-bookkeeping-exception-tag--${row.exceptionType}`,
                        ],
                      },
                      () => exceptionTypeLabel(row.exceptionType),
                    ),
                },
              ),
              h(ElTableColumn, { prop: 'transactionNo', label: '交易编号', minWidth: 154 }),
              h(ElTableColumn, { prop: 'backToBackContract', label: '背靠背合约', minWidth: 170 }),
              h(ElTableColumn, { prop: 'term', label: '期限', width: 92, align: 'center' }),
              h(
                ElTableColumn,
                { label: '开平类型', width: 96, align: 'center' },
                {
                  default: ({ row }: { row: BookkeepingException }) =>
                    h(
                      'span',
                      {
                        class:
                          row.category === 'opening'
                            ? 'option-bookkeeping-open-close--opening'
                            : 'option-bookkeeping-open-close--closing',
                      },
                      row.category === 'opening' ? '开仓' : '平仓',
                    ),
                },
              ),
              h(ElTableColumn, { prop: 'underlyingCode', label: '标的代码', minWidth: 118 }),
              h(ElTableColumn, {
                prop: 'counterparty',
                label: '交易对手',
                minWidth: 180,
                className: 'option-bookkeeping-counterparty-column',
              }),
              h(ElTableColumn, { prop: 'account', label: '资金账号', minWidth: 112 }),
              h(ElTableColumn, { prop: 'tradeDate', label: '交易日期', minWidth: 116 }),
              h(
                ElTableColumn,
                { label: '异常字段数', width: 104, fixed: 'right', align: 'center' },
                {
                  default: ({ row }: { row: BookkeepingException }) =>
                    h(
                      'span',
                      { class: 'option-bookkeeping-difference-count' },
                      String(row.differences.length),
                    ),
                },
              ),
              h(
                ElTableColumn,
                { label: '操作', width: 84, fixed: 'right', align: 'center' },
                {
                  default: ({ row }: { row: BookkeepingException }) =>
                    !props.canProcess
                      ? h('span', { class: 'option-bookkeeping-operation-disabled' }, '—')
                      : row.exceptionType === 'bct-missing'
                        ? h(
                            ElButton,
                            {
                              link: true,
                              type: 'danger',
                              onClick: () => emit('void-bookkeeping', row),
                            },
                            { default: () => '作废' },
                          )
                        : h(
                            ElButton,
                            { link: true, type: 'primary', onClick: () => emit('process', row) },
                            { default: () => '处理' },
                          ),
                },
              ),
            ],
          },
        ),
      ])
  },
})

function createFilterForm(): FilterForm {
  return {
    transactionNo: '',
    backToBackContract: '',
    category: '',
    tradeDate: '',
  }
}

function createHistoryFilterForm(): HistoryFilterForm {
  return { transactionNo: '', changeType: '', accountType: '', modifiedAtRange: [] }
}

function includesText(value: string, keyword: string) {
  return value.toLowerCase().includes(keyword.trim().toLowerCase())
}

function isDateWithinRange(value: string, range: [string, string] | []) {
  if (!range.length) return true
  const date = value.slice(0, 10)
  return date >= range[0] && date <= range[1]
}

function applyFilters() {
  Object.assign(appliedFilters, draftFilters)
  exceptionCurrentPage.value = 1
}

function applyHistoryFilters() {
  Object.assign(historyAppliedFilters, historyDraftFilters)
  historyCurrentPage.value = 1
}

function resetFilters() {
  Object.assign(draftFilters, createFilterForm())
  Object.assign(appliedFilters, createFilterForm())
  activeSummaryExceptionType.value = ''
  exceptionCurrentPage.value = 1
}

function resetHistoryFilters() {
  Object.assign(historyDraftFilters, createHistoryFilterForm())
  Object.assign(historyAppliedFilters, createHistoryFilterForm())
  historyCurrentPage.value = 1
}

function snapshotColumns(records: HistoryChangeRecord[]) {
  const columns = new Map<string, SnapshotField>()
  records.forEach((record) => {
    record.snapshotFields.forEach((field) => {
      if (!columns.has(field.key)) columns.set(field.key, field)
    })
  })
  return Array.from(columns.values())
}

function snapshotColumnWidth(key: string) {
  return (
    {
      transactionNo: 164,
      backToBackContract: 164,
      fundAccount: 164,
      bookkeepingAt: 164,
      tradeDate: 104,
      accountType: 112,
      counterparty: 112,
      underlying: 180,
      coverReason: 120,
      optionPremiumRate: 104,
    }[key] ?? 88
  )
}

function snapshotFieldValue(record: HistoryChangeRecord, key: string) {
  return record.snapshotFields.find((field) => field.key === key)?.afterValue ?? '—'
}

function snapshotFieldDisplayValue(record: HistoryChangeRecord, key: string) {
  const value = snapshotFieldValue(record, key)

  return isSnapshotFieldManuallyTruncated(record, key)
    ? `${Array.from(value).slice(0, 8).join('')}...`
    : value
}

function isSnapshotFieldManuallyTruncated(record: HistoryChangeRecord, key: string) {
  return key === 'userName' && Array.from(snapshotFieldValue(record, key)).length > 8
}

function isSnapshotFieldChanged(
  record: HistoryChangeRecord,
  records: HistoryChangeRecord[],
  key: string,
) {
  const [latestRecord, previousRecord] = records

  if (!latestRecord) return false
  if (latestRecord.changeType === 'void') return latestRecord.id === record.id

  return Boolean(
    previousRecord &&
    latestRecord.id === record.id &&
    latestRecord.snapshotFields.find((field) => field.key === key)?.changed,
  )
}

function registerSnapshotTable(id: string, table: unknown) {
  if (!table || typeof (table as ScrollableTableInstance).setScrollLeft !== 'function') {
    snapshotTableRefs.delete(id)
    return
  }

  const snapshotTable = table as ScrollableTableInstance
  snapshotTableRefs.set(id, snapshotTable)
  snapshotTable.setScrollLeft(historyTableScrollLeft.value)
}

function syncSnapshotTablesScroll({ scrollLeft }: { scrollLeft: number }) {
  historyTableScrollLeft.value = scrollLeft
  snapshotTableRefs.forEach((snapshotTable) => snapshotTable.setScrollLeft(scrollLeft))
}

function toggleSummaryExceptionType(type: ExceptionType) {
  activeSummaryExceptionType.value = activeSummaryExceptionType.value === type ? '' : type
  exceptionCurrentPage.value = 1
}

function showAllExceptionTypes() {
  activeSummaryExceptionType.value = ''
  exceptionCurrentPage.value = 1
}

async function refreshData(showMessage = true) {
  if (isDataRefreshing.value) return
  isDataRefreshing.value = true
  await new Promise<void>((resolve) => window.setTimeout(resolve, 300))
  dataLoadedAt.value = formatDateTime(new Date())
  isDataRefreshing.value = false
  if (showMessage) ElMessage.success('数据已刷新')
}

function formatDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function appendHistoryChanges(
  record: BookkeepingException,
  changes: HistoryChangeDraft[],
  changeType: HistoryChangeType = 'update',
  coverReason = changeType === 'void' ? 'BCT 撤销后作废簿记' : '审批通过后覆盖原有值',
) {
  if (!changes.length) return

  const approvedBy = userStore.userInfo?.real_name || userStore.userInfo?.username || '当前交易员'
  const approvedAt = formatDateTime(new Date())
  const accountType = '客户账号'
  const snapshotRecord = {
    transactionNo: record.transactionNo,
    backToBackContract: record.backToBackContract,
    accountType,
  }
  const latestChange = changes.reduce((latest, change) =>
    change.modifiedAt > latest.modifiedAt ? change : latest,
  )
  const sourceChannel = changes.every((change) => change.sourceChannel === changes[0].sourceChannel)
    ? changes[0].sourceChannel
    : '簿记修改'
  const changedValues = Object.fromEntries(
    changes.map((change) => [snapshotFieldKey(change.modificationItem), change.modifiedValue]),
  )
  const beforeValues = Object.fromEntries(
    changes.map((change) => [snapshotFieldKey(change.modificationItem), change.originalValue]),
  )
  const snapshotFields =
    changeType === 'void'
      ? createVoidSnapshotFields(snapshotRecord, { ...sampleClientSnapshotValues, coverReason })
      : createSnapshotFields(snapshotRecord, changedValues, beforeValues, {
          ...sampleClientSnapshotValues,
          coverReason,
        })
  const firstChange = changes[0]
  historyChanges.value = [
    {
      id: `history-${record.id}-${approvedAt}`,
      transactionNo: record.transactionNo,
      backToBackContract: record.backToBackContract,
      accountType,
      changeType,
      modificationItem:
        changeType === 'void'
          ? '簿记状态'
          : changes.map((change) => change.modificationItem).join('、'),
      sourceChannel,
      originalValue:
        changeType === 'void'
          ? '已簿记'
          : changes
              .map((change) => `${change.modificationItem}：${change.originalValue}`)
              .join('；'),
      modifiedValue:
        changeType === 'void'
          ? '已作废'
          : changes
              .map((change) => `${change.modificationItem}：${change.modifiedValue}`)
              .join('；'),
      modifiedBy: latestChange.modifiedBy || firstChange.modifiedBy,
      modifiedAt: latestChange.modifiedAt,
      approvedBy,
      approvedAt,
      coverReason,
      larkPushStatus: '已推送' as const,
      snapshotFields,
    },
    ...historyChanges.value,
  ]
}

function summarizeExceptions(rows: BookkeepingException[]) {
  return {
    total: rows.length,
    fauconMissing: rows.filter((item) => item.exceptionType === 'faucon-missing').length,
    bctMissing: rows.filter((item) => item.exceptionType === 'bct-missing').length,
    fieldMismatch: rows.filter((item) => item.exceptionType === 'field-mismatch').length,
    historicalDataModified: rows.filter((item) => item.exceptionType === 'historical-data-modified')
      .length,
  }
}

function exceptionTypeLabel(type: ExceptionType) {
  return {
    'faucon-missing': '簿记作废',
    'bct-missing': 'BCT 撤销',
    'field-mismatch': '数据不一致',
    'historical-data-modified': '历史数据修改',
  }[type]
}

function exceptionTagType(type: ExceptionType): 'warning' | 'info' | 'danger' | 'primary' {
  return exceptionTagTypes[type]
}

function differenceColumnMinWidth(difference: FieldDifference) {
  const visualLength = (value: string) =>
    Array.from(value).reduce((total, char) => total + (char.charCodeAt(0) > 255 ? 14 : 7), 0)
  const widestValue = Math.max(
    ...[difference.field, difference.fauconValue, difference.bctValue].map(visualLength),
  )

  return Math.min(280, Math.max(120, widestValue + 32))
}

function historicalDataChangesFor(record: BookkeepingException | null) {
  return record?.historicalDataChanges ?? []
}

function openMaintenance(record: BookkeepingException) {
  maintenanceRecord.value = record
  maintenanceReason.value = ''
  maintenanceBulkChoice.value = 'faucon'
  Object.keys(maintenanceChoices).forEach((key) => delete maintenanceChoices[key])
  record.differences.forEach((difference) => {
    maintenanceChoices[difference.field] = 'faucon'
  })
}

function openHistoricalModification(record: BookkeepingException) {
  historicalModificationRecord.value = record
  historicalModificationChoice.value = 'approve'
}

function applyMaintenanceChoice(choice: 'faucon' | 'bct') {
  if (!maintenanceRecord.value) return
  maintenanceRecord.value.differences.forEach((difference) => {
    maintenanceChoices[difference.field] = choice
  })
}

function openBookkeeping(record: BookkeepingException) {
  bookkeepingRecord.value = record
  bookkeepingAccountTab.value = 'client'
  activeBookkeepingSection.value = 'option-elements'
  bookkeepingReason.value = ''
  Object.keys(bookkeepingForms).forEach((key) => delete bookkeepingForms[key])

  const defaults = bookkeepingSections.value
    .flatMap((section) => section.fields)
    .reduce(
      (values, field) => {
        values[field.key] = field.value
        return values
      },
      {} as Record<string, string>,
    )

  bookkeepingAccountTabs.forEach((accountTab, index) => {
    bookkeepingForms[accountTab.name] = {
      ...defaults,
      tradeNo: record.transactionNo,
      tradeRival: record.counterparty,
      fundAccount: index === 0 ? record.account : `CICC-00${index}`,
      underlyingCode: record.underlyingCode,
      dealDate: record.tradeDate,
      backToBackContract: record.backToBackContract,
      ourRole: ['proprietary-sell', 'hedge'].includes(accountTab.name) ? '乙方' : '甲方',
    }
  })
}

function openProcess(record: BookkeepingException) {
  if (record.exceptionType === 'faucon-missing') {
    openBookkeeping(record)
    return
  }
  if (record.exceptionType === 'historical-data-modified') {
    openHistoricalModification(record)
    return
  }
  openMaintenance(record)
}

async function voidBookkeeping(record: BookkeepingException) {
  const transactionType = record.category === 'closing' ? '平仓' : '开仓'

  try {
    await ElMessageBox.confirm(
      h('div', [
        h('div', `作废后不可恢复，确认作废这笔${transactionType}簿记吗？`),
        h('div', `交易编号：${record.transactionNo}`),
      ]),
      `${transactionType}作废确认`,
      {
        confirmButtonText: '确认作废',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
  } catch {
    return
  }

  appendHistoryChanges(
    record,
    record.differences.map((difference) => ({
      modificationItem: difference.field,
      sourceChannel: 'BCT 同步',
      originalValue: difference.fauconValue,
      modifiedValue: difference.bctValue,
      modifiedBy: 'BCT 系统',
      modifiedAt: dataLoadedAt.value,
    })),
    'void',
    'BCT 撤销后作废簿记',
  )
  exceptions.value = exceptions.value.filter((item) => item.id !== record.id)
  ElMessage.success(`${transactionType}簿记已作废，已推送 Lark`)
}

async function confirmMaintenance() {
  if (!maintenanceRecord.value) return
  if (!maintenanceReason.value.trim()) {
    ElMessage.warning('请填写覆盖原因')
    return
  }

  try {
    await ElMessageBox.confirm('确定修改吗？确定后将覆盖原有值。', '确认修改', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }

  const record = maintenanceRecord.value
  if (record) {
    appendHistoryChanges(
      record,
      record.differences.map((difference) => ({
        modificationItem: difference.field,
        sourceChannel: 'BCT 同步',
        originalValue: difference.fauconValue,
        modifiedValue: difference.bctValue,
        modifiedBy: 'BCT 系统',
        modifiedAt: dataLoadedAt.value,
      })),
      'update',
      maintenanceReason.value.trim(),
    )
  }
  exceptions.value = exceptions.value.filter((item) => item.id !== maintenanceRecord.value?.id)
  maintenanceRecord.value = null
  ElMessage.success('最终值及覆盖原因已确认，异常记录已完成维护并推送 Lark')
}

async function confirmHistoricalModification() {
  const record = historicalModificationRecord.value
  const changes = historicalDataChangesFor(record)
  if (!record || !changes.length) return

  const isApproved = historicalModificationChoice.value === 'approve'
  const operation = isApproved ? '同意修改' : '拒绝修改'
  const result = isApproved ? '修改值生效' : '恢复原始值'

  try {
    await ElMessageBox.confirm(
      isApproved
        ? `确认同意${changes.length}项修改并使修改值生效吗？`
        : `确认拒绝${changes.length}项修改并恢复原始值吗？`,
      '确认处理',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
  } catch {
    return
  }

  exceptions.value = exceptions.value.filter((item) => item.id !== record.id)
  if (isApproved) {
    appendHistoryChanges(
      record,
      changes.map((change) => ({
        modificationItem: change.field,
        sourceChannel: change.source,
        originalValue: change.originalValue,
        modifiedValue: change.modifiedValue,
        modifiedBy: change.modifiedBy,
        modifiedAt: change.modifiedAt,
      })),
      'update',
      '同意历史数据修改后覆盖原有值',
    )
  }
  historicalModificationRecord.value = null
  ElMessage.success(
    isApproved ? `已${operation}，${result}，已推送 Lark` : `已${operation}，${result}`,
  )
}

function scrollToBookkeepingSection(sectionId: string) {
  activeBookkeepingSection.value = sectionId
  const target = document.getElementById(`bookkeeping-section-${sectionId}`)
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function isBookkeepingSelectField(field: BookkeepingField) {
  return Boolean(bookkeepingSelectOptions[field.key])
}

function isBookkeepingDateField(field: BookkeepingField) {
  return bookkeepingDateFields.has(field.key)
}

function bookkeepingFieldOptions(field: BookkeepingField) {
  return bookkeepingSelectOptions[field.key] ?? []
}

function bookkeepingFieldSuffix(field: BookkeepingField) {
  if (field.key === 'term') return 'M'
  if (
    ['strikeRatio', 'participationRate', 'frontPremiumRate', 'minimumYield'].includes(field.key)
  ) {
    return '%'
  }
  return ''
}

function isBookkeepingFieldEditable(field: BookkeepingField) {
  if (field.readonly) return false
  if (field.key === 'initialPremium') return bookkeepingAccountTab.value === 'hedge'
  if (field.key === 'unwindExchangeRate') {
    const form = activeBookkeepingForm.value
    return form.tradeCurrency !== form.settlementCurrency
  }
  return Boolean(field.editable)
}

function isBookkeepingFieldRequiredFor(
  field: BookkeepingField,
  form: Record<string, string>,
  accountTab: string,
) {
  if (bookkeepingRecord.value?.category === 'opening') {
    if (field.key === 'optionOrderNo') return form.backToBackLabel === 'CLSA'
    return openingRequiredFields.has(field.key)
  }

  if (field.key === 'initialPremium') return accountTab === 'hedge'
  if (field.key === 'unwindExchangeRate') return form.tradeCurrency !== form.settlementCurrency
  return closingRequiredFields.has(field.key)
}

function isBookkeepingFieldRequired(field: BookkeepingField) {
  return isBookkeepingFieldRequiredFor(
    field,
    activeBookkeepingForm.value,
    bookkeepingAccountTab.value,
  )
}

function validateBookkeeping(scope: 'all' | 'current') {
  const accountTabs =
    scope === 'all'
      ? bookkeepingAccountTabs
      : bookkeepingAccountTabs.filter(
          (accountTab) => accountTab.name === bookkeepingAccountTab.value,
        )

  for (const accountTab of accountTabs) {
    const form = bookkeepingForms[accountTab.name]
    for (const section of bookkeepingSections.value) {
      const requiredField = section.fields.find(
        (field) =>
          isBookkeepingFieldRequiredFor(field, form, accountTab.name) &&
          !String(form[field.key] ?? '').trim(),
      )
      if (requiredField) {
        bookkeepingAccountTab.value = accountTab.name
        activeBookkeepingSection.value = section.id
        ElMessage.warning(`请填写${accountTab.label}的${requiredField.label}`)
        return false
      }
    }
  }

  if (!bookkeepingReason.value.trim()) {
    ElMessage.warning('请填写覆盖原因')
    return false
  }

  return true
}

function saveBookkeeping(scope: 'all' | 'current', bookNow: boolean) {
  if (!bookkeepingRecord.value) return
  if (!validateBookkeeping(scope)) return

  if (bookNow) {
    exceptions.value = exceptions.value.filter((item) => item.id !== bookkeepingRecord.value?.id)
    bookkeepingRecord.value = null
    ElMessage.success(scope === 'all' ? '全部账户已保存并完成簿记' : '当前账户已保存并完成簿记')
    return
  }

  ElMessage.success(scope === 'all' ? '全部账户簿记信息已保存' : '当前账户簿记信息已保存')
}

onMounted(() => {
  autoRefreshTimer = window.setInterval(() => refreshData(false), 30 * 60 * 1000)
})

onUnmounted(() => {
  if (autoRefreshTimer) window.clearInterval(autoRefreshTimer)
  snapshotTableRefs.clear()
})
</script>

<style scoped>
.option-bookkeeping-page {
  display: flex;
  min-width: 0;
  min-height: calc(100dvh - 134px);
  overflow: hidden;
}

.option-bookkeeping-card {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: calc(100dvh - 134px);
  padding: 0 24px 20px;
  background: #fff;
  border-radius: 8px;
}

.option-bookkeeping-tabs {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  margin-top: 0;
}

.option-bookkeeping-tabs :deep(.el-tabs__header) {
  flex: 0 0 auto;
  margin: 0;
  order: 0;
}

.option-bookkeeping-tabs :deep(.el-tabs__content),
.option-bookkeeping-tabs :deep(.el-tab-pane.is-active) {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}

.option-bookkeeping-tabs :deep(.el-tabs__content) {
  order: 1;
}

.option-bookkeeping-tabs :deep(.el-tabs__item) {
  height: 48px;
  padding: 0 20px;
  color: #4e5969;
  font-size: 14px;
  line-height: 48px;
}

.option-bookkeeping-tabs :deep(.el-tabs__item.is-active) {
  color: #165dff;
  font-weight: 600;
}

.option-bookkeeping-tabs :deep(.el-tabs__active-bar) {
  height: 2px;
}

.option-bookkeeping-placeholder {
  display: grid;
  min-height: 410px;
  place-items: center;
}

.option-bookkeeping-reconciliation,
.option-bookkeeping-history {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  padding-top: 20px;
}

.option-bookkeeping-history__filter {
  margin-bottom: 4px;
}

.option-bookkeeping-summary {
  min-width: 0;
  overflow: hidden;
  background: #f7f9fc;
  border: 1px solid #e5eaf2;
  border-radius: 4px;
}

.option-bookkeeping-summary__topline {
  display: flex;
  min-height: 34px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 18px;
  background: #fff;
  border-bottom: 1px solid #eef1f5;
}

.option-bookkeeping-summary__topline > div:first-child {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 10px;
}

.option-bookkeeping-summary__topline strong {
  color: #1d2129;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.option-bookkeeping-summary__topline > div:first-child span {
  overflow: hidden;
  color: #86909c;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.option-bookkeeping-summary__metrics {
  display: grid;
  grid-template-columns: 148px repeat(4, minmax(0, 1fr));
}

.option-bookkeeping-summary__total,
.option-bookkeeping-summary__metric {
  display: flex;
  position: relative;
  align-items: center;
  gap: 12px;
  min-width: 0;
  min-height: 72px;
  padding: 12px 18px;
  background: #fff;
}

.option-bookkeeping-summary__metrics > * + * {
  border-left: 1px solid #e5eaf2;
}

.option-bookkeeping-summary__total {
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
}

.option-bookkeeping-summary__total > span {
  color: #4e5969;
  font-size: 12px;
}

.option-bookkeeping-summary__total strong {
  color: #165dff;
  font-size: 24px;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.option-bookkeeping-summary__total strong em {
  margin-left: 3px;
  color: #86909c;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
}

.option-bookkeeping-summary__icon {
  display: inline-flex;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 16px;
  line-height: 1;
}

.option-bookkeeping-summary__icon svg {
  width: 27px;
  height: 27px;
  fill: currentColor;
  transform-origin: center;
}

.option-bookkeeping-summary__metric--blue .option-bookkeeping-summary__icon svg {
  transform: scale(0.82);
}

.option-bookkeeping-summary__metric-copy {
  min-width: 0;
  flex: 1;
}

.option-bookkeeping-summary__metric {
  cursor: pointer;
}

.option-bookkeeping-summary__total:focus-visible,
.option-bookkeeping-summary__metric:focus-visible {
  z-index: 1;
  outline: 2px solid #165dff;
  outline-offset: -2px;
}

.option-bookkeeping-summary__total.is-active::after,
.option-bookkeeping-summary__metric.is-active::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  content: '';
}

.option-bookkeeping-summary__total.is-active::after {
  background: #165dff;
}

.option-bookkeeping-summary__metric-copy > span {
  display: inline-block;
  color: #1d2129;
  font-size: 14px;
  font-weight: 600;
}

.option-bookkeeping-summary__metric strong {
  color: #f53f3f;
  font-size: 24px;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.option-bookkeeping-summary__metric strong em {
  margin-left: 3px;
  color: #86909c;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
}

.option-bookkeeping-summary__metric p {
  margin: 4px 0 0;
  overflow: hidden;
  color: #86909c;
  font-size: 12px;
  line-height: 17px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.option-bookkeeping-summary__refresh {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #86909c;
  font-size: 12px;
  white-space: nowrap;
}

.option-bookkeeping-summary__refresh :deep(.el-button) {
  height: auto;
  padding: 0;
  font-size: 12px;
}

.option-bookkeeping-summary__metric--orange .option-bookkeeping-summary__icon {
  color: #ff7d00;
}

.option-bookkeeping-summary__metric--orange.is-active::after {
  background: #ff7d00;
}

.option-bookkeeping-summary__metric--blue .option-bookkeeping-summary__icon {
  color: #165dff;
}

.option-bookkeeping-summary__metric--blue.is-active::after {
  background: #165dff;
}

.option-bookkeeping-summary__metric--red .option-bookkeeping-summary__icon {
  color: #f53f3f;
}

.option-bookkeeping-summary__metric--red.is-active::after {
  background: #f53f3f;
}

.option-bookkeeping-summary__metric--purple .option-bookkeeping-summary__icon {
  color: #722ed1;
}

.option-bookkeeping-summary__metric--purple.is-active::after {
  background: #722ed1;
}

.option-bookkeeping-summary__metric--purple .option-bookkeeping-summary__icon svg {
  transform: scale(0.82);
}

.option-bookkeeping-summary__metric--purple .option-bookkeeping-summary__icon path {
  fill: currentColor;
}

.option-bookkeeping-operation-disabled {
  color: #c9cdd4;
}

.option-bookkeeping-maintenance-reason {
  display: grid;
  gap: 8px;
  margin-top: 18px;
  color: #344054;
  font-size: 14px;
  font-weight: 600;
}

.option-bookkeeping-maintenance-reason em {
  margin-left: 2px;
  color: #f53f3f;
  font-style: normal;
}

.option-bookkeeping-filter {
  flex: 0 0 auto;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: end;
  margin-top: 20px;
  padding: 0 0 16px;
}

.option-bookkeeping-filter label {
  display: grid;
  flex: 0 0 240px;
  width: 240px;
  min-width: 0;
  gap: 7px;
  color: #344054;
  font-size: 13px;
  font-weight: 600;
}

.option-bookkeeping-filter :deep(.el-select),
.option-bookkeeping-filter :deep(.el-date-editor),
.option-bookkeeping-filter :deep(.el-input) {
  width: 100%;
}

.option-bookkeeping-filter__actions {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

.option-bookkeeping-table-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}

.option-bookkeeping-pagination {
  display: flex;
  flex: 0 0 auto;
  justify-content: flex-end;
  padding-top: 16px;
}

.option-bookkeeping-table-panel__heading {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.option-bookkeeping-table-panel__heading span {
  color: #86909c;
  font-size: 13px;
}

.option-bookkeeping-table-panel__actions {
  display: flex;
  align-items: center;
  gap: 14px;
  white-space: nowrap;
}

:deep(.option-bookkeeping-table-scroll) {
  display: flex;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

:deep(.option-bookkeeping-exception-table) {
  height: 100%;
}

:deep(.option-bookkeeping-exception-table .el-table__expanded-cell) {
  padding: 16px 20px;
  background: #fafbfc;
}

:deep(.option-bookkeeping-differences) {
  min-width: 0;
  max-width: 100%;
  width: 100%;
}

:deep(.option-bookkeeping-differences h3) {
  margin: 0 0 10px;
  color: #344054;
  font-size: 14px;
  font-weight: 600;
}

:deep(.option-bookkeeping-differences-table) {
  --el-table-border-color: #e5e6eb;
  --el-table-header-bg-color: #f7f8fa;
  --el-table-header-text-color: #666666;
  --el-table-row-hover-bg-color: #fafafa;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
}

:deep(.option-bookkeeping-differences-table .el-table__inner-wrapper::before) {
  display: none;
}

:deep(.option-bookkeeping-differences-table th.el-table__cell) {
  background: #f7f8fa;
  color: #666666;
  font-weight: 600;
}

:deep(.option-bookkeeping-differences-table td.el-table__cell) {
  background: #fff;
}

:deep(.option-bookkeeping-differences-table .el-table__body tr:last-child td.el-table__cell) {
  border-bottom: 0;
}

:deep(.option-bookkeeping-differences-table .cell) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: keep-all;
}

.option-bookkeeping-history-table {
  width: 100%;
  height: 100%;
  min-width: 0;
}

.option-bookkeeping-history-table :deep(.el-table__expanded-cell) {
  padding: 16px 20px;
  background: #fafbfc;
}

.option-bookkeeping-history-table
  > :deep(
    .el-table__inner-wrapper
      > .el-table__body-wrapper
      > table.el-table__body
      > tbody
      > tr
      > td.el-table__cell:not(.el-table__expanded-cell)
      > .cell
  ) {
  display: -webkit-box;
  max-height: 40px;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-height: 20px;
  text-overflow: ellipsis;
  word-break: break-word;
}

.option-bookkeeping-history-records {
  min-width: 0;
  max-width: 100%;
  width: 100%;
}

.option-bookkeeping-history-records__heading {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
}

.option-bookkeeping-history-records__heading strong {
  color: #344054;
  font-size: 14px;
  font-weight: 600;
}

.option-bookkeeping-snapshot-table {
  --el-table-border-color: #e5e6eb;
  --el-table-header-bg-color: #f7f8fa;
  --el-table-header-text-color: #666666;
  --el-table-row-hover-bg-color: #fafafa;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
}

.option-bookkeeping-snapshot-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.option-bookkeeping-snapshot-table :deep(th.el-table__cell) {
  background: #f7f8fa;
  color: #666666;
  font-weight: 600;
}

.option-bookkeeping-snapshot-table :deep(td.el-table__cell) {
  background: #fff;
}

.option-bookkeeping-snapshot-table :deep(.el-table__body tr:last-child td.el-table__cell) {
  border-bottom: 0;
}

.option-bookkeeping-snapshot-table :deep(.el-table-fixed-column--left) {
  background: #fff;
}

.option-bookkeeping-snapshot-table :deep(.cell) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: keep-all;
}

.option-bookkeeping-snapshot-value {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.option-bookkeeping-difference-count) {
  color: #f53f3f;
  font-weight: 600;
}

:deep(.option-bookkeeping-open-close--opening) {
  color: #f53f3f;
  font-weight: 600;
}

:deep(.option-bookkeeping-open-close--closing) {
  color: #00b42a;
  font-weight: 600;
}

:deep(.option-bookkeeping-exception-tag--bct-missing) {
  color: #165dff;
  background: #e8f3ff;
  border-color: #c5dcff;
}

:deep(.option-bookkeeping-counterparty-column .cell) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: keep-all;
}

.option-bookkeeping-maintenance-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 12px;
  color: #4e5969;
  font-size: 13px;
  background: #f7f9fc;
  border-radius: 4px;
}

.option-bookkeeping-maintenance-summary > div:first-child,
.option-bookkeeping-maintenance-summary__bulk {
  display: flex;
  align-items: center;
  gap: 16px;
}

.option-bookkeeping-historical-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-bottom: 16px;
  padding: 12px;
  color: #4e5969;
  font-size: 13px;
  background: #f7f9fc;
  border-radius: 4px;
}

.option-bookkeeping-snapshot-value--changed {
  color: #f53f3f;
  font-weight: 600;
}

.option-bookkeeping-historical-choice {
  display: grid;
  gap: 10px;
  margin-top: 18px;
  color: #344054;
  font-size: 14px;
  font-weight: 600;
}

.option-bookkeeping-historical-choice em {
  margin-left: 2px;
  color: #f53f3f;
  font-style: normal;
}

.option-bookkeeping-maintenance-summary__bulk {
  gap: 10px;
  color: #344054;
}

.option-bookkeeping-maintenance-summary__bulk :deep(.el-radio-button__inner) {
  padding: 6px 9px;
  font-size: 12px;
}

.option-bookkeeping-maintenance-table :deep(.el-radio) {
  margin-right: 10px;
  font-size: 12px;
}

.option-bookkeeping-maintenance-table :deep(.el-radio:last-child) {
  margin-right: 0;
}

.option-bookkeeping-maintenance-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
}

:global(.option-bookkeeping-drawer .el-drawer__header) {
  box-sizing: border-box;
  flex: 0 0 42px;
  height: 42px;
  min-height: 42px;
  margin-bottom: 0;
  padding: 7px 24px;
  border-bottom: 1px solid #e5eaf2;
}

:global(.option-bookkeeping-drawer .el-drawer__body) {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

:global(.option-bookkeeping-drawer .el-drawer__footer) {
  padding: 14px 24px;
  border-top: 1px solid #e5eaf2;
}

.option-bookkeeping-drawer__header h2 {
  margin: 0;
  color: #1d2129;
  font-size: 18px;
  font-weight: 600;
  line-height: 28px;
}

.option-bookkeeping-drawer__workspace {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}

.option-bookkeeping-drawer__overview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  padding: 14px 24px;
  color: #4e5969;
  font-size: 13px;
  background: #f7f9fc;
  border-bottom: 1px solid #e5eaf2;
}

.option-bookkeeping-drawer__accounts {
  position: sticky;
  top: 0;
  z-index: 3;
  margin-top: 12px;
  padding: 0 24px;
  background: #fff;
}

.option-bookkeeping-drawer__accounts :deep(.el-tabs__header) {
  margin: 0;
}

.option-bookkeeping-drawer__accounts :deep(.el-tabs__content) {
  display: none;
}

.option-bookkeeping-drawer__accounts :deep(.el-tabs__item) {
  height: 44px;
  padding: 0 18px;
  line-height: 44px;
}

.option-bookkeeping-drawer__layout {
  display: grid;
  position: relative;
  min-height: 0;
  flex: 1;
  grid-template-columns: 172px minmax(0, 1fr);
  overflow: hidden;
  border-top: 1px solid #e5eaf2;
}

.option-bookkeeping-anchor-menu {
  position: sticky;
  top: 0;
  align-self: stretch;
  height: 100%;
  min-height: 0;
  padding: 18px 12px;
  overflow-y: auto;
  background: #fafbfc;
  border-right: 1px solid #e5eaf2;
}

.option-bookkeeping-anchor-menu__title {
  display: block;
  padding: 0 12px 8px;
  color: #86909c;
  font-size: 12px;
}

.option-bookkeeping-anchor-menu__item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  color: #4e5969;
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 4px;
}

.option-bookkeeping-anchor-menu__item + .option-bookkeeping-anchor-menu__item {
  margin-top: 4px;
}

.option-bookkeeping-anchor-menu__item:hover,
.option-bookkeeping-anchor-menu__item.is-active {
  color: #165dff;
  background: #e8f3ff;
}

.option-bookkeeping-drawer__content {
  min-height: 0;
  min-width: 0;
  padding: 20px 24px 28px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.option-bookkeeping-form-section {
  scroll-margin-top: 16px;
}

.option-bookkeeping-form-section + .option-bookkeeping-form-section {
  margin-top: 28px;
}

.option-bookkeeping-form-section__heading {
  margin-bottom: 14px;
}

.option-bookkeeping-form-section__heading h3 {
  margin: 0;
  color: #1d2129;
  font-size: 15px;
  font-weight: 600;
}

.option-bookkeeping-form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px 16px;
}

.option-bookkeeping-form-field {
  display: grid;
  min-width: 0;
  gap: 7px;
  color: #4e5969;
  font-size: 13px;
}

.option-bookkeeping-form-field > span {
  color: #344054;
  font-weight: 500;
}

.option-bookkeeping-form-field > span em {
  margin-left: 2px;
  color: #f53f3f;
  font-style: normal;
}

.option-bookkeeping-form-field :deep(.el-select),
.option-bookkeeping-form-field :deep(.el-date-editor) {
  width: 100%;
}

.option-bookkeeping-form-field__value {
  min-height: 32px;
  padding: 7px 11px;
  overflow: hidden;
  color: #1d2129;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
}

.option-bookkeeping-form-field--full {
  display: grid;
  width: 100%;
}

.option-bookkeeping-form-section--reason {
  padding: 18px;
  background: #fafbfc;
  border: 1px solid #e5eaf2;
  border-radius: 8px;
}

.option-bookkeeping-drawer__footer {
  display: flex;
  justify-content: center;
  gap: 8px;
}

@media (max-width: 1200px) {
  .option-bookkeeping-summary__metrics {
    grid-template-columns: 132px repeat(4, minmax(104px, 1fr));
  }
}

@media (max-width: 860px) {
  .option-bookkeeping-card {
    padding: 18px;
  }

  .option-bookkeeping-summary__topline {
    min-height: 42px;
    align-items: flex-start;
    flex-direction: column;
    justify-content: center;
    gap: 0;
  }

  .option-bookkeeping-summary__metrics {
    grid-template-columns: 1fr;
  }

  .option-bookkeeping-summary__metrics > * + * {
    border-top: 1px solid #eef1f5;
    border-left: 0;
  }

  .option-bookkeeping-form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
