import { expect, Locator } from '@playwright/test';
import { DashboardPage } from '..';
import BasePage from '../../Base';
import { CellPageObject, CellProps } from '../common/Cell';
import { ColumnPageObject } from './Column';
import { TopbarPage } from '../common/Topbar';
import { ToolbarPage } from '../common/Toolbar';
import { FootbarPage } from '../common/Footbar';
import { ProjectMenuObject } from '../common/ProjectMenu';
import { QrCodeOverlay } from '../QrCodeOverlay';
import { BarcodeOverlay } from '../BarcodeOverlay';
import { RowPageObject } from './Row';
import { WorkspaceMenuObject } from '../common/WorkspaceMenu';
import { GroupPageObject } from './Group';

export class GridPage extends BasePage {
  readonly dashboard: DashboardPage;
  readonly addNewTableButton: Locator;
  readonly dashboardPage: DashboardPage;
  readonly qrCodeOverlay: QrCodeOverlay;
  readonly barcodeOverlay: BarcodeOverlay;
  readonly column: ColumnPageObject;
  readonly cell: CellPageObject;
  readonly topbar: TopbarPage;
  readonly toolbar: ToolbarPage;
  readonly footbar: FootbarPage;
  readonly projectMenu: ProjectMenuObject;
  readonly workspaceMenu: WorkspaceMenuObject;
  readonly rowPage: RowPageObject;
  readonly groupPage: GroupPageObject;

  constructor(dashboardPage: DashboardPage) {
    super(dashboardPage.rootPage);
    this.dashboard = dashboardPage;
    this.addNewTableButton = dashboardPage.get().locator('.nc-add-new-table');
    this.qrCodeOverlay = new QrCodeOverlay(this);
    this.barcodeOverlay = new BarcodeOverlay(this);
    this.column = new ColumnPageObject(this);
    this.cell = new CellPageObject(this);
    this.topbar = new TopbarPage(this);
    this.toolbar = new ToolbarPage(this);
    this.footbar = new FootbarPage(this);
    this.projectMenu = new ProjectMenuObject(this);
    this.workspaceMenu = new WorkspaceMenuObject(this);
    this.rowPage = new RowPageObject(this);
    this.groupPage = new GroupPageObject(this);
  }

  get() {
    return this.dashboard.get().locator('[data-testid="nc-grid-wrapper"]');
  }

  row(index: number) {
    return this.get().locator(`tr[data-testid="grid-row-${index}"]`);
  }

  async rowCount() {
    return await this.get().locator('.nc-grid-row').count();
  }

  async verifyRowCount({ count }: { count: number }) {
    return await expect(this.get().locator('.nc-grid-row')).toHaveCount(count);
  }

  private async _fillRow({ index, columnHeader, value }: { index: number; columnHeader: string; value: string }) {
    const cell = this.cell.get({ index, columnHeader });
    await cell.waitFor({ state: 'visible' });
    await this.cell.dblclick({
      index,
      columnHeader,
    });

    await cell.locator('input').fill(value);
  }

  async addNewRow({
    index = 0,
    columnHeader = 'Title',
    value,
    networkValidation = true,
  }: {
    index?: number;
    columnHeader?: string;
    value?: string;
    networkValidation?: boolean;
  } = {}) {
    const rowValue = value ?? `Row ${index}`;
    // wait for render to complete before count
    if (index !== 0) await this.get().locator('.nc-grid-row').nth(0).waitFor({ state: 'attached' });

    await (await this.get().locator('.nc-grid-add-new-cell').elementHandle())?.waitForElementState('stable');
    await this.rootPage.waitForTimeout(100);

    const rowCount = await this.get().locator('.nc-grid-row').count();

    await this.get().locator('.nc-grid-add-new-cell').click();

    // add delay for UI to render (can wait for count to stabilize by reading it multiple times)
    await this.rootPage.waitForTimeout(100);
    await expect(await this.get().locator('.nc-grid-row').count()).toBe(rowCount + 1);

    await this._fillRow({ index, columnHeader, value: rowValue });

    const clickOnColumnHeaderToSave = () =>
      this.get().locator(`[data-title="${columnHeader}"]`).locator(`div[title="${columnHeader}"]`).click();

    if (networkValidation) {
      await this.waitForResponse({
        uiAction: clickOnColumnHeaderToSave,
        requestUrlPathToMatch: 'api/v1/db/data/noco',
        httpMethodsToMatch: ['POST'],
        // numerical types are returned in number format from the server
        responseJsonMatcher: resJson => String(resJson?.[columnHeader]) === String(rowValue),
      });
    } else {
      await clickOnColumnHeaderToSave();
      await this.rootPage.waitForTimeout(300);
    }

    await this.dashboard.waitForLoaderToDisappear();
  }

  async editRow({
    index = 0,
    columnHeader = 'Title',
    value,
    networkValidation = true,
  }: {
    index?: number;
    columnHeader?: string;
    value: string;
    networkValidation?: boolean;
  }) {
    await this._fillRow({ index, columnHeader, value });

    const clickOnColumnHeaderToSave = () =>
      this.get().locator(`[data-title="${columnHeader}"]`).locator(`div[title="${columnHeader}"]`).click();

    if (networkValidation) {
      await this.waitForResponse({
        uiAction: clickOnColumnHeaderToSave,
        requestUrlPathToMatch: 'api/v1/db/data/noco',
        httpMethodsToMatch: [
          'PATCH',
          // since edit row on an empty row will emit POST request
          'POST',
        ],
        // numerical types are returned in number format from the server
        responseJsonMatcher: resJson => String(resJson?.[columnHeader]) === String(value),
      });
    } else {
      await clickOnColumnHeaderToSave();
      await this.rootPage.waitForTimeout(300);
    }

    await this.dashboard.waitForLoaderToDisappear();
  }

  async verifyRow({ index }: { index: number }) {
    await this.get().locator(`td[data-testid="cell-Title-${index}"]`).waitFor({ state: 'visible' });
    await expect(this.get().locator(`td[data-testid="cell-Title-${index}"]`)).toHaveCount(1);
  }

  async verifyRowDoesNotExist({ index }: { index: number }) {
    await this.get().locator(`td[data-testid="cell-Title-${index}"]`).waitFor({ state: 'hidden' });
    return await expect(this.get().locator(`td[data-testid="cell-Title-${index}"]`)).toHaveCount(0);
  }

  async deleteRow(index: number, title = 'Title') {
    await this.get().getByTestId(`cell-${title}-${index}`).click({
      button: 'right',
    });

    // Click text=Delete Row
    await this.rootPage.locator('text=Delete Row').click();

    // todo: improve selector
    await this.rootPage
      .locator('span.ant-dropdown-menu-title-content > nc-project-menu-item')
      .waitFor({ state: 'hidden' });

    await this.rootPage.waitForTimeout(300);
    await this.dashboard.waitForLoaderToDisappear();
  }

  async addRowRightClickMenu(index: number, columnHeader = 'Title') {
    const rowCount = await this.get().locator('.nc-grid-row').count();

    const cell = await this.get().locator(`td[data-testid="cell-${columnHeader}-${index}"]`).last();
    await cell.click();
    await cell.click({ button: 'right' });

    // Click text=Insert New Row
    await this.rootPage.locator('text=Insert New Row').click();
    await expect(await this.get().locator('.nc-grid-row')).toHaveCount(rowCount + 1);
  }

  async openExpandedRow({ index }: { index: number }) {
    await this.row(index).locator(`td[data-testid="cell-Id-${index}"]`).hover();
    await this.row(index).locator(`div[data-testid="nc-expand-${index}"]`).click();
    await (await this.rootPage.locator('.ant-drawer-body').elementHandle())?.waitForElementState('stable');
  }

  async selectRow(index: number) {
    const cell: Locator = await this.get().locator(`td[data-testid="cell-Id-${index}"]`);
    await cell.hover();
    await cell.locator('input[type="checkbox"]').check({ force: true });
  }

  async selectAll() {
    await this.get().locator('[data-testid="nc-check-all"]').hover();

    await this.get().locator('[data-testid="nc-check-all"]').locator('input[type="checkbox"]').check({
      force: true,
    });

    const rowCount = await this.rowCount();
    for (let i = 0; i < rowCount; i++) {
      await expect(
        this.row(i).locator(`[data-testid="cell-Id-${i}"]`).locator('span.ant-checkbox-checked')
      ).toHaveCount(1);
    }
    await this.rootPage.waitForTimeout(300);
  }

  async openAllRowContextMenu() {
    await this.get().locator('[data-testid="nc-check-all"]').nth(0).click({
      button: 'right',
    });
  }

  async deleteSelectedRows() {
    await this.get().locator('[data-testid="nc-check-all"]').nth(0).click({
      button: 'right',
    });
    await this.rootPage.locator('text=Delete Selected Rows').click();
    await this.dashboard.waitForLoaderToDisappear();
  }

  async deleteAll() {
    await this.selectAll();
    await this.deleteSelectedRows();
  }

  async updateSelectedRows() {
    await this.get().locator('[data-testid="nc-check-all"]').nth(0).click({
      button: 'right',
    });
    await this.rootPage.locator('text=Update Selected Rows').click();
    await this.dashboard.waitForLoaderToDisappear();
  }

  async updateAll() {
    await this.selectAll();
    await this.updateSelectedRows();
  }

  async verifyTotalRowCount({ count }: { count: number }) {
    // wait for 100 ms and try again : 5 times
    let i = 0;
    await this.get().locator(`.nc-pagination`).waitFor();
    let records = await this.get().locator(`[data-testid="grid-pagination"]`).allInnerTexts();
    let recordCnt = records[0].split(' ')[0];

    while (parseInt(recordCnt) !== count && i < 5) {
      await this.get().locator(`.nc-pagination`).waitFor();
      records = await this.get().locator(`[data-testid="grid-pagination"]`).allInnerTexts();
      recordCnt = records[0].split(' ')[0];

      // to ensure page loading is complete
      i++;
      await this.rootPage.waitForTimeout(100 * i);
    }
    expect(parseInt(recordCnt)).toEqual(count);
  }

  async verifyPaginationCount({ count }: { count: number }) {
    let i = 0;
    await this.get().locator(`.nc-pagination`).first().waitFor();
    let records = await this.get().locator(`[data-testid="grid-pagination"]`).allInnerTexts();
    let recordCnt = records[0].split(' ')[0];

    while (parseInt(recordCnt) !== count && i < 5) {
      await this.get().locator(`.nc-pagination`).first().waitFor();
      records = await this.get().locator(`[data-testid="grid-pagination"]`).allInnerTexts();
      recordCnt = records[0].split(' ')[0];

      // to ensure page loading is complete
      i++;
      await this.rootPage.waitForTimeout(300 * i);
    }
    expect(parseInt(recordCnt)).toEqual(count);
  }

  private async pagination({ page }: { page: string }) {
    await this.get().locator(`.nc-pagination`).waitFor();

    if (page === '<') return this.get().locator('.nc-pagination > .ant-pagination-prev');
    if (page === '>') return this.get().locator('.nc-pagination > .ant-pagination-next');

    return this.get().locator(`.nc-pagination > .ant-pagination-item.ant-pagination-item-${page}`);
  }

  async clickPagination({ page, skipWait = false }: { page: string; skipWait?: boolean }) {
    if (!skipWait) {
      await (await this.pagination({ page })).click();
      await this.waitLoading();
    } else {
      await this.waitForResponse({
        uiAction: async () => (await this.pagination({ page })).click(),
        httpMethodsToMatch: ['GET'],
        requestUrlPathToMatch: '/views/',
        responseJsonMatcher: resJson => resJson?.pageInfo,
      });

      await this.waitLoading();
    }
  }

  async verifyActivePage({ page }: { page: string }) {
    await expect(await this.pagination({ page })).toHaveClass(/ant-pagination-item-active/);
  }

  async waitLoading() {
    await this.dashboard.get().locator('[data-testid="grid-load-spinner"]').waitFor({ state: 'hidden' });
  }

  async verifyEditDisabled({ columnHeader = 'Title' }: { columnHeader?: string } = {}) {
    // double click to toggle to edit mode
    const cell = this.cell.get({ index: 0, columnHeader: columnHeader });
    await this.cell.dblclick({
      index: 0,
      columnHeader: columnHeader,
    });
    await expect(await cell.locator('input')).not.toBeVisible();

    // right click menu
    await this.get().locator(`td[data-testid="cell-${columnHeader}-0"]`).click({
      button: 'right',
    });
    await expect(await this.rootPage.locator('text=Insert New Row')).not.toBeVisible();

    // in cell-add
    await this.cell.get({ index: 0, columnHeader: 'Cities' }).hover();
    await expect(
      await this.cell.get({ index: 0, columnHeader: 'Cities' }).locator('.nc-action-icon.nc-plus')
    ).not.toBeVisible();

    // expand row
    await this.cell.get({ index: 0, columnHeader: 'Cities' }).hover();
    await expect(
      await this.cell.get({ index: 0, columnHeader: 'Cities' }).locator('.nc-action-icon >> nth=0')
    ).not.toBeVisible();
  }

  async verifyEditEnabled({ columnHeader = 'Title' }: { columnHeader?: string } = {}) {
    // double click to toggle to edit mode
    const cell = this.cell.get({ index: 0, columnHeader: columnHeader });
    await this.cell.dblclick({
      index: 0,
      columnHeader: columnHeader,
    });
    await expect(await cell.locator('input')).toBeVisible();

    // press escape to exit edit mode
    await cell.press('Escape');

    // right click menu
    await this.get().locator(`td[data-testid="cell-${columnHeader}-0"]`).click({
      button: 'right',
    });
    await expect(await this.rootPage.locator('text=Insert New Row')).toBeVisible();

    // in cell-add
    await this.cell.get({ index: 0, columnHeader: 'Cities' }).hover();
    await expect(
      await this.cell.get({ index: 0, columnHeader: 'Cities' }).locator('.nc-action-icon.nc-plus')
    ).toBeVisible();
  }

  async verifyRoleAccess(param: { role: string }) {
    await this.column.verifyRoleAccess(param);
    await this.cell.verifyRoleAccess(param);
    await this.toolbar.verifyRoleAccess(param);
    await this.footbar.verifyRoleAccess(param);
  }

  async selectRange({ start, end }: { start: CellProps; end: CellProps }) {
    const startCell = await this.cell.get({ index: start.index, columnHeader: start.columnHeader });
    const endCell = await this.cell.get({ index: end.index, columnHeader: end.columnHeader });
    const page = await this.dashboard.get().page();
    await startCell.hover();
    await page.mouse.down();
    await endCell.hover();
    await page.mouse.up();
  }

  async selectedCount() {
    return this.get().locator('.cell.active').count();
  }

  async copyWithKeyboard() {
    // retry to avoid flakiness, until text is copied to clipboard
    //
    let text = '';
    let retryCount = 5;
    while (text === '') {
      await this.get().press((await this.isMacOs()) ? 'Meta+C' : 'Control+C');
      await this.verifyToast({ message: 'Copied to clipboard' });
      text = await this.getClipboardText();

      // retry if text is empty till count is reached
      retryCount--;
      if (0 === retryCount) {
        break;
      }
    }
    return text;
  }

  async copyWithMouse({ index, columnHeader }: CellProps) {
    // retry to avoid flakiness, until text is copied to clipboard
    //
    let text = '';
    let retryCount = 5;
    while (text === '') {
      await this.cell.get({ index, columnHeader }).click({ button: 'right' });
      await this.get().page().getByTestId('context-menu-item-copy').click();
      await this.verifyToast({ message: 'Copied to clipboard' });
      text = await this.getClipboardText();

      // retry if text is empty till count is reached
      retryCount--;
      if (0 === retryCount) {
        break;
      }
    }
    return text;
  }
}
