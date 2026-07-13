import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminTable, type AdminTableColumn } from "./AdminTable";

type Row = {
  readonly id: string;
  readonly title: string;
};

test("admin table derives column sizing and explicit dividers from its column definitions", () => {
  const columns: readonly AdminTableColumn<Row>[] = [
    { header: "상태", key: "status", render: () => "게시됨", width: 120 },
    { header: "제목", key: "title", render: (row) => row.title, width: 600 },
    { header: "상세", key: "detail", render: () => "상세", width: 120 },
  ];

  const html = renderToStaticMarkup(
    <AdminTable
      ariaLabel="관리 목록"
      columns={columns}
      getRowKey={(row) => row.id}
      rows={[{ id: "row-1", title: "테스트 제목" }]}
    />,
  );

  assert.match(html, /grid-template-columns:120px 600px 120px/);
  assert.match(html, /role="columnheader"/);
  assert.equal(html.match(/aria-hidden="true"/g)?.length, columns.length - 1);
  assert.match(html, />테스트 제목</);
});
